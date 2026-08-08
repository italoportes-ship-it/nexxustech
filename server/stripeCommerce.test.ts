import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createWebhookEvent: vi.fn(),
  completeWebhookEvent: vi.fn(),
  getPaymentById: vi.fn(),
  getPaymentBySession: vi.fn(),
  getPaymentByIntent: vi.fn(),
  getCommerceOrder: vi.fn(),
  updateCommercePayment: vi.fn(),
  updateCheckoutCustomerStripeId: vi.fn(),
  markOrderPaid: vi.fn(),
  markOrderFailed: vi.fn(),
  markOrderCancelled: vi.fn(),
  markOrderRefunded: vi.fn(),
  markOrderChargeback: vi.fn(),
  queueAndSendOrderMessage: vi.fn(),
  requestInvoiceForOrder: vi.fn(),
}));

vi.mock("./commerceDb", () => mocks);
vi.mock("./commerceService", () => ({
  markOrderPaid: mocks.markOrderPaid,
  markOrderFailed: mocks.markOrderFailed,
  markOrderCancelled: mocks.markOrderCancelled,
  markOrderRefunded: mocks.markOrderRefunded,
  markOrderChargeback: mocks.markOrderChargeback,
}));
vi.mock("./commerceMessaging", () => ({ queueAndSendOrderMessage: mocks.queueAndSendOrderMessage }));
vi.mock("./fiscal", () => ({ requestInvoiceForOrder: mocks.requestInvoiceForOrder }));

import { processStripeEvent, registerStripeWebhook, stripe } from "./stripe";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  mocks.createWebhookEvent.mockResolvedValue({ inserted: true, id: 1 });
  mocks.getPaymentById.mockResolvedValue({ id: 20, orderId: 10 });
  mocks.getCommerceOrder.mockResolvedValue({ id: 10, status: "pending", customerEmail: "buyer@example.com", totalAmount: "1255.90" });
  mocks.markOrderPaid.mockResolvedValue({ alreadyPaid: false });
  mocks.queueAndSendOrderMessage.mockResolvedValue({ sent: false, pendingConfiguration: true });
  mocks.requestInvoiceForOrder.mockResolvedValue({ requested: false, status: "pending_configuration" });
});

function checkoutEvent(id = "evt_1", paymentStatus = "paid") {
  return {
    id,
    type: "checkout.session.completed",
    data: { object: {
      id: "cs_test",
      payment_status: paymentStatus,
      amount_total: 125590,
      currency: "brl",
      payment_intent: "pi_test",
      payment_method_types: ["card"],
      customer: "cus_test",
      metadata: { order_id: "10", payment_id: "20", user_id: "1" },
    } },
  } as any;
}

describe("processStripeEvent", () => {
  it("processa pagamento liquidado e aciona entrega/fiscal apenas uma vez", async () => {
    const result = await processStripeEvent(checkoutEvent(), "hash");
    expect(result).toMatchObject({ duplicate: false, orderId: 10, paymentId: 20 });
    expect(mocks.markOrderPaid).toHaveBeenCalledWith(expect.objectContaining({ orderId: 10, amountTotal: 1255.9, currency: "brl" }));
    expect(mocks.queueAndSendOrderMessage).toHaveBeenCalledTimes(1);
    expect(mocks.requestInvoiceForOrder).toHaveBeenCalledWith(10);
    expect(mocks.completeWebhookEvent).toHaveBeenCalledWith(1, expect.objectContaining({ status: "processed", orderId: 10, paymentId: 20 }));
  });

  it("ignora evento duplicado sem repetir efeitos", async () => {
    mocks.createWebhookEvent.mockResolvedValue({ inserted: false, id: 1 });
    expect(await processStripeEvent(checkoutEvent("evt_dup"), "hash")).toMatchObject({ duplicate: true });
    expect(mocks.markOrderPaid).not.toHaveBeenCalled();
    expect(mocks.queueAndSendOrderMessage).not.toHaveBeenCalled();
  });

  it("mantém Pix/boleto pendente até o evento assíncrono de sucesso", async () => {
    const result = await processStripeEvent(checkoutEvent("evt_pending", "unpaid"), "hash");
    expect(result).toMatchObject({ orderId: 10, paymentId: 20 });
    expect(mocks.updateCommercePayment).toHaveBeenCalledWith(20, expect.objectContaining({ status: "processing", externalSessionId: "cs_test" }));
    expect(mocks.markOrderPaid).not.toHaveBeenCalled();
  });

  it("registra falha do PaymentIntent sem liberar pagamento", async () => {
    const event = {
      id: "evt_failed",
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_failed", metadata: { order_id: "10", payment_id: "20" }, last_payment_error: { code: "card_declined", message: "Cartão recusado" } } },
    } as any;
    const result = await processStripeEvent(event, "hash");
    expect(result).toMatchObject({ orderId: 10, paymentId: 20 });
    expect(mocks.markOrderFailed).toHaveBeenCalledWith({ orderId: 10, paymentId: 20, code: "card_declined", message: "Cartão recusado" });
    expect(mocks.markOrderPaid).not.toHaveBeenCalled();
  });
});

describe("registerStripeWebhook", () => {
  it("responde ao evento de verificação com o formato exigido", async () => {
    let handler: any;
    registerStripeWebhook({ post: (_path: string, fn: any) => { handler = fn; } });
    vi.spyOn(stripe.webhooks, "constructEvent").mockReturnValue({ id: "evt_test_verify", type: "ping", data: { object: {} } } as any);
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
    await handler({ headers: { "stripe-signature": "sig" }, body: Buffer.from("{}") }, response);
    expect(response.json).toHaveBeenCalledWith({ verified: true });
    expect(mocks.createWebhookEvent).not.toHaveBeenCalled();
  });
});
