import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCommerceOrder: vi.fn(),
  getOrderInvoice: vi.fn(),
  getCommerceOrderItems: vi.fn(),
  getOrderLicenses: vi.fn(),
  updateInvoice: vi.fn(),
  createCommerceMessage: vi.fn(),
  getCommerceMessage: vi.fn(),
  updateCommerceMessage: vi.fn(),
}));

vi.mock("./commerceDb", () => mocks);

import { requestInvoiceForOrder } from "./fiscal";
import { dispatchCommerceMessage } from "./commerceMessaging";

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.NFEIO_INVOICE_KEY;
  delete process.env.NFEIO_COMPANY_ID;
  delete process.env.NFEIO_CITY_SERVICE_CODE;
  delete process.env.RESEND_API_KEY;
  delete process.env.COMMERCE_FROM_EMAIL;
  mocks.getCommerceOrder.mockResolvedValue({ id: 10, status: "paid", totalAmount: "1255.90", customerEmail: "buyer@example.com", orderNumber: "NXT-TEST" });
  mocks.getOrderInvoice.mockResolvedValue({ id: 1, orderId: 10, status: "pending_configuration" });
  mocks.getCommerceOrderItems.mockResolvedValue([{ productName: "Ampler", quantity: 1 }]);
  mocks.getOrderLicenses.mockResolvedValue([{ status: "awaiting_vendor" }]);
  mocks.getCommerceMessage.mockResolvedValue({ id: 5, orderId: 10, messageType: "payment_confirmed", recipientEmail: "buyer@example.com" });
});

describe("fiscal adapter", () => {
  it("não emite nota sem credenciais e registra configuração pendente", async () => {
    const result = await requestInvoiceForOrder(10);
    expect(result).toEqual({ requested: false, status: "pending_configuration" });
    expect(mocks.updateInvoice).toHaveBeenCalledWith(10, expect.objectContaining({ provider: "unconfigured", status: "pending_configuration" }));
  });

  it("bloqueia nota antes do pagamento", async () => {
    mocks.getCommerceOrder.mockResolvedValue({ id: 10, status: "pending" });
    await expect(requestInvoiceForOrder(10)).rejects.toThrow("após pagamento");
  });
});

describe("commerce messaging adapter", () => {
  it("mantém e-mail pendente sem provedor configurado", async () => {
    const result = await dispatchCommerceMessage(5);
    expect(result).toEqual({ sent: false, pendingConfiguration: true });
    expect(mocks.updateCommerceMessage).toHaveBeenCalledWith(5, expect.objectContaining({ status: "pending_configuration" }));
  });
});
