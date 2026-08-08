import type { User } from "../drizzle/schema";
import * as commerceDb from "./commerceDb";
import { encryptSensitive, decryptSensitive, generateOrderNumber, maskSecretLast4, sha256, taxIdLast4, validateTaxId } from "./commerceSecurity";
import { notifyOwner } from "./_core/notification";
import { sendOrderToCRM } from "./crm";

export type BuyerInput = {
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

export type CheckoutItemInput = {
  productId: number;
  quantity: number;
};

function normalizeBuyer(buyer: BuyerInput) {
  const taxId = validateTaxId(buyer.taxId, buyer.customerType);
  const email = buyer.email.trim().toLowerCase();
  const phone = buyer.phone.replace(/[^0-9+]/g, "");
  return {
    ...buyer,
    fullName: buyer.fullName.trim(),
    legalName: buyer.legalName?.trim() || null,
    email,
    taxId,
    phone,
    address: {
      ...buyer.address,
      postalCode: buyer.address.postalCode.replace(/\D/g, ""),
      state: buyer.address.state.trim().toUpperCase(),
      country: buyer.address.country.trim().toUpperCase(),
    },
  };
}

export async function getCheckoutBuyerProfile(userId: number) {
  const customer = await commerceDb.getCheckoutCustomerByUserId(userId);
  if (!customer) return null;
  return {
    customerType: customer.customerType,
    fullName: customer.fullName,
    legalName: customer.legalName,
    email: customer.email,
    taxId: decryptSensitive(customer.taxIdEncrypted),
    phone: customer.phoneEncrypted ? decryptSensitive(customer.phoneEncrypted) : "",
    address: customer.billingAddressEncrypted ? JSON.parse(decryptSensitive(customer.billingAddressEncrypted)) : null,
  };
}

export async function prepareCheckoutOrder(input: {
  user: User;
  buyer: BuyerInput;
  item: CheckoutItemInput;
  requestId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const buyer = normalizeBuyer(input.buyer);
  if (buyer.email !== input.user.email?.trim().toLowerCase()) throw new Error("O e-mail do comprador deve ser o mesmo da conta autenticada.");
  if (!Number.isInteger(input.item.quantity) || input.item.quantity <= 0 || input.item.quantity > 10_000) throw new Error("Quantidade inválida.");

  const idempotencyKey = sha256(`${input.user.id}:${input.requestId}`);
  const existing = await commerceDb.getOrderByIdempotencyKey(idempotencyKey);
  if (existing) return { order: existing, existing: true as const };

  const sourceIpHash = input.ipAddress ? sha256(input.ipAddress) : null;
  const recentOrders = await commerceDb.countRecentCheckoutOrders(input.user.id, sourceIpHash, new Date(Date.now() - 10 * 60 * 1000));
  if (recentOrders >= 5) throw new Error("Muitas tentativas de checkout. Aguarde alguns minutos e tente novamente.");

  const product = await commerceDb.getCheckoutProduct(input.item.productId);
  if (!product) throw new Error("Produto indisponível.");
  const price = await commerceDb.getPublishedCheckoutPrice(product.id, input.item.quantity);
  if (!price?.approvedPriceBrl) throw new Error("Este produto ainda não possui preço homologado para a quantidade informada.");
  const unitPrice = Number(price.approvedPriceBrl);
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new Error("Preço homologado inválido.");

  const customerId = await commerceDb.upsertCheckoutCustomer({
    userId: input.user.id,
    customerType: buyer.customerType,
    fullName: buyer.fullName,
    legalName: buyer.legalName,
    email: buyer.email,
    taxIdEncrypted: encryptSensitive(buyer.taxId),
    taxIdLast4: taxIdLast4(buyer.taxId),
    phoneEncrypted: encryptSensitive(buyer.phone),
    billingAddressEncrypted: encryptSensitive(JSON.stringify(buyer.address)),
  });

  const subtotal = unitPrice * input.item.quantity;
  const result = await commerceDb.createCommerceOrder({
    userId: input.user.id,
    customerId,
    orderNumber: generateOrderNumber(),
    customerEmail: buyer.email,
    customerSnapshotEncrypted: encryptSensitive(JSON.stringify(buyer)),
    idempotencyKey,
    sourceIpHash,
    userAgentHash: input.userAgent ? sha256(input.userAgent) : null,
    subtotalAmount: subtotal,
    discountAmount: 0,
    totalAmount: subtotal,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    items: [{
      productId: product.id,
      productPriceId: price.id,
      productName: product.name,
      planName: price.planName,
      unitPrice,
      quantity: input.item.quantity,
      licenseTerm: price.billingPeriod === "annual" ? "12 meses" : price.billingPeriod === "monthly" ? "1 mês" : "Conforme proposta",
    }],
  });

  const order = await commerceDb.getCommerceOrder(result.orderId);
  if (!order) throw new Error("Pedido não localizado após criação.");
  return { order, paymentId: result.paymentId, existing: false as const, customer: buyer, item: { product, price, unitPrice, quantity: input.item.quantity } };
}

export async function getSafeOrderDetails(orderId: number, userId: number, isAdmin = false) {
  const order = await commerceDb.getCommerceOrder(orderId);
  if (!order || (!isAdmin && order.userId !== userId)) return undefined;
  const [items, payment, invoice, orderLicenses] = await Promise.all([
    commerceDb.getCommerceOrderItems(orderId),
    commerceDb.getPaymentByOrder(orderId),
    commerceDb.getOrderInvoice(orderId),
    commerceDb.getOrderLicenses(orderId),
  ]);

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      currency: order.currency,
      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      couponCode: order.couponCode,
      paymentMethod: order.paymentMethod,
      customerEmail: order.customerEmail,
      internalNotes: isAdmin ? order.internalNotes : undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      failedAt: order.failedAt,
      cancelledAt: order.cancelledAt,
      refundedAt: order.refundedAt,
      chargebackAt: order.chargebackAt,
      expiresAt: order.expiresAt,
    },
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      planName: item.planName,
      unitPrice: item.unitPrice || item.price,
      totalPrice: item.totalPrice,
      currency: item.currency,
      licenseTerm: item.licenseTerm,
      quantity: item.quantity,
    })),
    payment: payment ? {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      confirmedAt: payment.confirmedAt,
      createdAt: payment.createdAt,
      ...(isAdmin ? { externalSessionId: payment.externalSessionId, externalPaymentIntentId: payment.externalPaymentIntentId, externalChargeId: payment.externalChargeId, failureCode: payment.failureCode, failureMessage: payment.failureMessage } : {}),
    } : null,
    invoice: invoice ? {
      id: invoice.id,
      provider: invoice.provider,
      documentType: invoice.documentType,
      status: invoice.status,
      number: invoice.number,
      pdfUrl: invoice.status === "issued" ? invoice.pdfUrl : null,
      issuedAt: invoice.issuedAt,
      ...(isAdmin ? { externalId: invoice.externalId, errorMessage: invoice.errorMessage } : {}),
    } : null,
    licenses: orderLicenses.map((license) => ({
      id: license.id,
      productId: license.productId,
      quantity: license.quantity,
      status: license.status,
      entitlement: maskSecretLast4(license.entitlementTokenLast4),
      licenseKey: license.status === "active" && license.licenseKeyEncrypted ? decryptSensitive(license.licenseKeyEncrypted) : null,
      licenseKeyMasked: maskSecretLast4(license.licenseKeyLast4),
      downloadUrl: license.status === "active" ? license.downloadUrl : null,
      installationInstructions: license.status === "active" ? license.installationInstructions : null,
      activatedAt: license.activatedAt,
      expiresAt: license.expiresAt,
    })),
  };
}

export async function markOrderPaid(input: {
  orderId: number;
  paymentId: number;
  sessionId?: string | null;
  paymentIntentId?: string | null;
  chargeId?: string | null;
  paymentMethod?: string | null;
  amountTotal: number;
  currency: string;
}) {
  const order = await commerceDb.getCommerceOrder(input.orderId);
  if (!order) throw new Error("Pedido do pagamento não encontrado.");
  if (order.status === "paid") return { alreadyPaid: true };
  if (order.status === "refunded" || order.status === "chargeback") throw new Error(`Pedido em estado terminal: ${order.status}.`);
  if (input.currency.toUpperCase() !== "BRL") throw new Error("Moeda do pagamento divergente.");
  if (Math.abs(Number(order.totalAmount) - input.amountTotal) > 0.009) throw new Error("Valor do pagamento divergente do pedido.");

  await commerceDb.updateCommercePayment(input.paymentId, {
    status: "succeeded",
    externalSessionId: input.sessionId || undefined,
    externalPaymentIntentId: input.paymentIntentId || undefined,
    externalChargeId: input.chargeId || undefined,
    paymentMethod: input.paymentMethod || undefined,
    confirmedAt: new Date(),
  });
  await commerceDb.updateCommerceOrderStatus(input.orderId, "paid", {
    stripeSessionId: input.sessionId || undefined,
    stripePaymentIntentId: input.paymentIntentId || undefined,
    paymentMethod: input.paymentMethod || undefined,
  });
  await commerceDb.activatePaidEntitlements(input.orderId);

  const items = await commerceDb.getCommerceOrderItems(input.orderId);
  await notifyOwner({
    title: `Pagamento confirmado — ${order.orderNumber || `Pedido #${order.id}`}`,
    content: `Valor: R$ ${Number(order.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nCliente: ${order.customerEmail || "N/A"}\nLicença: aguardando provisionamento oficial do fornecedor.`,
  });
  await sendOrderToCRM({
    orderId: input.orderId,
    customerName: order.customerEmail || "Cliente",
    customerEmail: order.customerEmail || "",
    totalAmount: Number(order.totalAmount).toFixed(2),
    items: items.map((item) => item.productName),
  });
  return { alreadyPaid: false };
}

export async function markOrderFailed(input: { orderId: number; paymentId: number; code?: string | null; message?: string | null }) {
  const order = await commerceDb.getCommerceOrder(input.orderId);
  if (!order || order.status === "paid" || order.status === "refunded" || order.status === "chargeback") return;
  await commerceDb.updateCommercePayment(input.paymentId, { status: "failed", failureCode: input.code || null, failureMessage: input.message?.slice(0, 500) || null });
  await commerceDb.updateCommerceOrderStatus(input.orderId, "failed");
}

export async function markOrderCancelled(orderId: number, paymentId?: number) {
  const order = await commerceDb.getCommerceOrder(orderId);
  if (!order || order.status !== "pending") return;
  if (paymentId) await commerceDb.updateCommercePayment(paymentId, { status: "cancelled" });
  await commerceDb.updateCommerceOrderStatus(orderId, "cancelled");
}

export async function markOrderRefunded(orderId: number, paymentId: number) {
  const order = await commerceDb.getCommerceOrder(orderId);
  if (!order || order.status === "refunded") return;
  await commerceDb.updateCommercePayment(paymentId, { status: "refunded" });
  await commerceDb.updateCommerceOrderStatus(orderId, "refunded");
  await commerceDb.revokeOrderLicenses(orderId);
}

export async function markOrderChargeback(orderId: number, paymentId: number) {
  const order = await commerceDb.getCommerceOrder(orderId);
  if (!order || order.status === "chargeback") return;
  await commerceDb.updateCommercePayment(paymentId, { status: "chargeback" });
  await commerceDb.updateCommerceOrderStatus(orderId, "chargeback");
  await commerceDb.revokeOrderLicenses(orderId);
}

export async function fulfillVendorLicense(input: { licenseId: number; licenseKey?: string | null; downloadUrl?: string | null; installationInstructions?: string | null }) {
  const license = await commerceDb.getLicenseById(input.licenseId);
  if (!license) throw new Error("Licença não encontrada.");
  const order = await commerceDb.getCommerceOrder(license.orderId);
  if (!order || order.status !== "paid") throw new Error("A licença só pode ser ativada após pagamento confirmado.");
  const licenseKey = input.licenseKey?.trim() || null;
  if (!licenseKey && !input.downloadUrl) throw new Error("Informe uma chave oficial ou um link oficial de download.");
  await commerceDb.fulfillLicense({
    licenseId: input.licenseId,
    encryptedKey: licenseKey ? encryptSensitive(licenseKey) : null,
    keyLast4: licenseKey ? licenseKey.slice(-4) : null,
    downloadUrl: input.downloadUrl?.trim() || null,
    installationInstructions: input.installationInstructions?.trim() || null,
  });
  await commerceDb.createCommerceMessage({ orderId: order.id, messageType: "license_ready", recipientEmail: order.customerEmail || "", status: "pending_configuration" });
}
