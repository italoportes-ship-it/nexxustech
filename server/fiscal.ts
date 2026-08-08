import * as commerceDb from "./commerceDb";
import { decryptSensitive } from "./commerceSecurity";

type FiscalBuyer = {
  customerType: "person" | "company";
  fullName: string;
  legalName?: string | null;
  email: string;
  taxId: string;
  phone: string;
  address: {
    postalCode: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    cityCode?: string | null;
    state: string;
    country: string;
  };
};

export async function requestInvoiceForOrder(orderId: number) {
  const [order, invoice, items] = await Promise.all([
    commerceDb.getCommerceOrder(orderId),
    commerceDb.getOrderInvoice(orderId),
    commerceDb.getCommerceOrderItems(orderId),
  ]);
  if (!order || !invoice) throw new Error("Pedido ou registro fiscal não encontrado.");
  if (order.status !== "paid") throw new Error("A nota só pode ser solicitada após pagamento confirmado.");
  if (invoice.status === "issued" || invoice.status === "processing") return { requested: false, status: invoice.status };

  const apiKey = process.env.NFEIO_INVOICE_KEY;
  const companyId = process.env.NFEIO_COMPANY_ID;
  const cityServiceCode = process.env.NFEIO_CITY_SERVICE_CODE;
  if (!apiKey || !companyId || !cityServiceCode) {
    await commerceDb.updateInvoice(orderId, {
      provider: "unconfigured",
      status: "pending_configuration",
      errorMessage: "Configure NFEIO_INVOICE_KEY, NFEIO_COMPANY_ID e NFEIO_CITY_SERVICE_CODE após validação contábil.",
    });
    return { requested: false, status: "pending_configuration" as const };
  }
  if (!order.customerSnapshotEncrypted) throw new Error("Snapshot fiscal do comprador ausente.");
  const buyer = JSON.parse(decryptSensitive(order.customerSnapshotEncrypted)) as FiscalBuyer;
  if (!buyer.address.cityCode) {
    await commerceDb.updateInvoice(orderId, { provider: "nfeio", status: "pending_configuration", errorMessage: "Código IBGE da cidade do comprador não informado." });
    return { requested: false, status: "pending_configuration" as const };
  }

  const description = items.map((item) => `${item.productName} — ${item.quantity} licença(s)`).join("; ");
  const payload = {
    borrower: {
      type: buyer.customerType === "company" ? "LegalEntity" : "NaturalPerson",
      name: buyer.legalName || buyer.fullName,
      federalTaxNumber: buyer.taxId,
      email: buyer.email,
      address: {
        country: buyer.address.country,
        postalCode: buyer.address.postalCode,
        street: buyer.address.street,
        number: buyer.address.number,
        additionalInformation: buyer.address.complement || undefined,
        district: buyer.address.neighborhood,
        city: { code: buyer.address.cityCode, name: buyer.address.city },
        state: buyer.address.state,
      },
    },
    cityServiceCode,
    description,
    servicesAmount: Number(order.totalAmount),
    externalId: order.orderNumber || `order-${order.id}`,
  };

  await commerceDb.updateInvoice(orderId, { provider: "nfeio", documentType: "nfse", status: "pending", errorMessage: null });
  try {
    const response = await fetch(`https://api.nfe.io/v1/companies/${encodeURIComponent(companyId)}/serviceinvoices`, {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((result as any)?.message || `NFE.io HTTP ${response.status}`);
    const externalId = String((result as any)?.id || (result as any)?.Id || "");
    if (!externalId) throw new Error("NFE.io não retornou identificador da nota.");
    await commerceDb.updateInvoice(orderId, { provider: "nfeio", documentType: "nfse", status: "processing", externalId, errorMessage: null });
    return { requested: true, status: "processing" as const, externalId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await commerceDb.updateInvoice(orderId, { provider: "nfeio", documentType: "nfse", status: "failed", errorMessage: message.slice(0, 1000) });
    return { requested: false, status: "failed" as const, error: message };
  }
}
