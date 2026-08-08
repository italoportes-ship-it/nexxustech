import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOrderByIdempotencyKey: vi.fn(),
  countRecentCheckoutOrders: vi.fn(),
  getCheckoutProduct: vi.fn(),
  getPublishedCheckoutPrice: vi.fn(),
  upsertCheckoutCustomer: vi.fn(),
  createCommerceOrder: vi.fn(),
  getCommerceOrder: vi.fn(),
  getCommerceOrderItems: vi.fn(),
  getPaymentByOrder: vi.fn(),
  getOrderInvoice: vi.fn(),
  getOrderLicenses: vi.fn(),
  updateCommercePayment: vi.fn(),
  updateCommerceOrderStatus: vi.fn(),
  activatePaidEntitlements: vi.fn(),
  revokeOrderLicenses: vi.fn(),
  createCommerceMessage: vi.fn(),
  getLicenseById: vi.fn(),
  fulfillLicense: vi.fn(),
  notifyOwner: vi.fn(),
  sendOrderToCRM: vi.fn(),
}));

vi.mock("./commerceDb", () => mocks);
vi.mock("./_core/notification", () => ({ notifyOwner: mocks.notifyOwner }));
vi.mock("./crm", () => ({ sendOrderToCRM: mocks.sendOrderToCRM }));

import { fulfillVendorLicense, getSafeOrderDetails, markOrderPaid, prepareCheckoutOrder } from "./commerceService";

const user = { id: 1, openId: "u", name: "Cliente", email: "cliente@example.com", loginMethod: "test", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const buyer = {
  customerType: "person" as const,
  fullName: "Cliente Teste",
  email: "cliente@example.com",
  taxId: "529.982.247-25",
  phone: "+5511999999999",
  address: { postalCode: "01001000", street: "Praça da Sé", number: "1", neighborhood: "Sé", city: "São Paulo", cityCode: "3550308", state: "SP", country: "BRA" },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET ||= "commerce-service-test-secret";
  mocks.getOrderByIdempotencyKey.mockResolvedValue(undefined);
  mocks.countRecentCheckoutOrders.mockResolvedValue(0);
  mocks.getCheckoutProduct.mockResolvedValue({ id: 30001, name: "Ampler", slug: "ampler", isActive: true });
  mocks.getPublishedCheckoutPrice.mockResolvedValue({ id: 8, planName: "Ampler anual", approvedPriceBrl: "1255.90", billingPeriod: "annual" });
  mocks.upsertCheckoutCustomer.mockResolvedValue(2);
  mocks.createCommerceOrder.mockResolvedValue({ orderId: 10, paymentId: 20 });
  mocks.getCommerceOrder.mockResolvedValue({ id: 10, userId: 1, orderNumber: "NXT-TEST", status: "pending", totalAmount: "1255.90", customerEmail: "cliente@example.com" });
  mocks.getCommerceOrderItems.mockResolvedValue([{ productName: "Ampler" }]);
  mocks.notifyOwner.mockResolvedValue(undefined);
  mocks.sendOrderToCRM.mockResolvedValue({ success: true });
});

describe("prepareCheckoutOrder", () => {
  it("usa preço homologado do servidor e cria estruturas transacionais", async () => {
    const result = await prepareCheckoutOrder({ user, buyer, item: { productId: 30001, quantity: 1 }, requestId: "d928f367-1e14-4bd7-8fa0-5f3318adb9f9" });
    expect(result.existing).toBe(false);
    expect(mocks.getPublishedCheckoutPrice).toHaveBeenCalledWith(30001, 1);
    expect(mocks.createCommerceOrder).toHaveBeenCalledWith(expect.objectContaining({
      userId: 1,
      customerId: 2,
      totalAmount: 1255.9,
      customerSnapshotEncrypted: expect.not.stringContaining("52998224725"),
      items: [expect.objectContaining({ productPriceId: 8, unitPrice: 1255.9, quantity: 1 })],
    }));
  });

  it("retorna o mesmo pedido para a mesma chave idempotente", async () => {
    mocks.getOrderByIdempotencyKey.mockResolvedValue({ id: 99, userId: 1, status: "pending" });
    const result = await prepareCheckoutOrder({ user, buyer, item: { productId: 30001, quantity: 1 }, requestId: "d928f367-1e14-4bd7-8fa0-5f3318adb9f9" });
    expect(result).toMatchObject({ existing: true, order: { id: 99 } });
    expect(mocks.getCheckoutProduct).not.toHaveBeenCalled();
  });

  it("rejeita produto sem preço homologado", async () => {
    mocks.getPublishedCheckoutPrice.mockResolvedValue(undefined);
    await expect(prepareCheckoutOrder({ user, buyer, item: { productId: 30001, quantity: 1 }, requestId: "d928f367-1e14-4bd7-8fa0-5f3318adb9f9" })).rejects.toThrow("preço homologado");
  });

  it("limita tentativas recentes por usuário ou IP", async () => {
    mocks.countRecentCheckoutOrders.mockResolvedValue(5);
    await expect(prepareCheckoutOrder({ user, buyer, item: { productId: 30001, quantity: 1 }, requestId: "d928f367-1e14-4bd7-8fa0-5f3318adb9f9", ipAddress: "203.0.113.10" })).rejects.toThrow("Muitas tentativas");
    expect(mocks.createCommerceOrder).not.toHaveBeenCalled();
  });
});

describe("markOrderPaid", () => {
  it("confirma valor, atualiza pagamento e libera entitlement uma vez", async () => {
    const result = await markOrderPaid({ orderId: 10, paymentId: 20, amountTotal: 1255.9, currency: "brl", sessionId: "cs_test", paymentIntentId: "pi_test", paymentMethod: "card" });
    expect(result.alreadyPaid).toBe(false);
    expect(mocks.updateCommercePayment).toHaveBeenCalledWith(20, expect.objectContaining({ status: "succeeded", externalPaymentIntentId: "pi_test" }));
    expect(mocks.updateCommerceOrderStatus).toHaveBeenCalledWith(10, "paid", expect.any(Object));
    expect(mocks.activatePaidEntitlements).toHaveBeenCalledWith(10);
  });

  it("não processa valor divergente", async () => {
    await expect(markOrderPaid({ orderId: 10, paymentId: 20, amountTotal: 1, currency: "brl" })).rejects.toThrow("Valor do pagamento divergente");
    expect(mocks.updateCommercePayment).not.toHaveBeenCalled();
  });

  it("é idempotente quando o pedido já está pago", async () => {
    mocks.getCommerceOrder.mockResolvedValue({ id: 10, status: "paid", totalAmount: "1255.90" });
    expect(await markOrderPaid({ orderId: 10, paymentId: 20, amountTotal: 1255.9, currency: "brl" })).toEqual({ alreadyPaid: true });
    expect(mocks.activatePaidEntitlements).not.toHaveBeenCalled();
  });
});

describe("fulfillVendorLicense", () => {
  it("bloqueia ativação antes do pagamento", async () => {
    mocks.getLicenseById.mockResolvedValue({ id: 5, orderId: 10 });
    mocks.getCommerceOrder.mockResolvedValue({ id: 10, status: "pending" });
    await expect(fulfillVendorLicense({ licenseId: 5, licenseKey: "REAL-KEY" })).rejects.toThrow("após pagamento");
    expect(mocks.fulfillLicense).not.toHaveBeenCalled();
  });
});

describe("getSafeOrderDetails", () => {
  it("remove dados criptografados, hashes e IDs Stripe da resposta do cliente", async () => {
    mocks.getCommerceOrder.mockResolvedValue({
      id: 10,
      userId: 1,
      orderNumber: "NXT-TEST",
      status: "pending",
      currency: "BRL",
      totalAmount: "1255.90",
      customerEmail: "cliente@example.com",
      customerSnapshotEncrypted: "secret-snapshot",
      idempotencyKey: "secret-idempotency",
      sourceIpHash: "secret-ip-hash",
      stripeSessionId: "cs_secret",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mocks.getCommerceOrderItems.mockResolvedValue([{ id: 1, productId: 30001, productName: "Ampler", planName: "Anual", unitPrice: "1255.90", totalPrice: "1255.90", currency: "BRL", quantity: 1 }]);
    mocks.getPaymentByOrder.mockResolvedValue({ id: 20, status: "pending", amount: "1255.90", currency: "BRL", externalSessionId: "cs_secret", createdAt: new Date() });
    mocks.getOrderInvoice.mockResolvedValue({ id: 30, status: "pending_configuration", provider: "unconfigured", documentType: "pending" });
    mocks.getOrderLicenses.mockResolvedValue([]);
    const details = await getSafeOrderDetails(10, 1);
    expect(details?.order).not.toHaveProperty("customerSnapshotEncrypted");
    expect(details?.order).not.toHaveProperty("idempotencyKey");
    expect(details?.order).not.toHaveProperty("sourceIpHash");
    expect(details?.order).not.toHaveProperty("stripeSessionId");
    expect(details?.payment).not.toHaveProperty("externalSessionId");
  });
});
