import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { customers, invoices, licenses, commerceMessages, orderItems, orders, payments, productPrices, products, webhookEvents } from "../drizzle/schema";
import { getDb } from "./db";
import { generateEntitlementToken } from "./commerceSecurity";

type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded" | "chargeback";
type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded" | "chargeback";

export async function getCheckoutCustomerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
  return result[0];
}

export async function upsertCheckoutCustomer(data: typeof customers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const existing = await getCheckoutCustomerByUserId(data.userId);
  if (existing) {
    await db.update(customers).set(data).where(eq(customers.id, existing.id));
    return existing.id;
  }
  const result = await db.insert(customers).values(data);
  return Number((result[0] as { insertId: number }).insertId);
}

export async function updateCheckoutCustomerStripeId(userId: number, stripeCustomerId: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(customers).set({ stripeCustomerId }).where(eq(customers.userId, userId));
}

export async function getCheckoutProduct(productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(and(eq(products.id, productId), eq(products.isActive, true))).limit(1);
  return result[0];
}

export async function getPublishedCheckoutPrice(productId: number, quantity: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productPrices).where(and(
    eq(productPrices.productId, productId),
    eq(productPrices.status, "published"),
    eq(productPrices.isPublic, true),
    lte(productPrices.minSeats, quantity),
    or(isNull(productPrices.maxSeats), gte(productPrices.maxSeats, quantity)),
  )).orderBy(desc(productPrices.minSeats)).limit(1);
  return result[0];
}

export async function getOrderByIdempotencyKey(idempotencyKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.idempotencyKey, idempotencyKey)).limit(1);
  return result[0];
}

export async function countRecentCheckoutOrders(userId: number, sourceIpHash: string | null, since: Date) {
  const db = await getDb();
  if (!db) return 0;
  const scope = sourceIpHash ? or(eq(orders.userId, userId), eq(orders.sourceIpHash, sourceIpHash)) : eq(orders.userId, userId);
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(and(scope, gte(orders.createdAt, since)));
  return Number(result[0]?.count || 0);
}

export async function createCommerceOrder(input: {
  userId: number;
  customerId: number;
  orderNumber: string;
  customerEmail: string;
  customerSnapshotEncrypted: string;
  idempotencyKey: string;
  sourceIpHash: string | null;
  userAgentHash: string | null;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  expiresAt: Date;
  items: Array<{
    productId: number;
    productPriceId: number;
    productName: string;
    planName: string;
    unitPrice: number;
    quantity: number;
    licenseTerm: string;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  return db.transaction(async (tx) => {
    const orderResult = await tx.insert(orders).values({
      userId: input.userId,
      customerId: input.customerId,
      orderNumber: input.orderNumber,
      status: "pending",
      currency: "BRL",
      subtotalAmount: input.subtotalAmount.toFixed(2),
      discountAmount: input.discountAmount.toFixed(2),
      totalAmount: input.totalAmount.toFixed(2),
      customerEmail: input.customerEmail,
      customerSnapshotEncrypted: input.customerSnapshotEncrypted,
      idempotencyKey: input.idempotencyKey,
      sourceIpHash: input.sourceIpHash,
      userAgentHash: input.userAgentHash,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      expiresAt: input.expiresAt,
    });
    const orderId = Number((orderResult[0] as { insertId: number }).insertId);

    for (const item of input.items) {
      const itemResult = await tx.insert(orderItems).values({
        orderId,
        productId: item.productId,
        productPriceId: item.productPriceId,
        productName: item.productName,
        planName: item.planName,
        price: item.unitPrice.toFixed(2),
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: (item.unitPrice * item.quantity).toFixed(2),
        currency: "BRL",
        licenseTerm: item.licenseTerm,
        quantity: item.quantity,
      });
      const orderItemId = Number((itemResult[0] as { insertId: number }).insertId);
      const entitlement = generateEntitlementToken();
      await tx.insert(licenses).values({
        orderId,
        orderItemId,
        userId: input.userId,
        productId: item.productId,
        quantity: item.quantity,
        status: "pending_payment",
        entitlementTokenHash: entitlement.hash,
        entitlementTokenLast4: entitlement.last4,
      });
    }

    const paymentResult = await tx.insert(payments).values({ orderId, status: "pending", amount: input.totalAmount.toFixed(2), currency: "BRL" });
    const paymentId = Number((paymentResult[0] as { insertId: number }).insertId);
    await tx.insert(invoices).values({ orderId, provider: "unconfigured", documentType: "pending", status: "pending_configuration" });
    await tx.insert(commerceMessages).values({ orderId, messageType: "order_created", recipientEmail: input.customerEmail, status: "pending_configuration" });

    return { orderId, paymentId };
  });
}

export async function attachStripeSession(input: { orderId: number; paymentId: number; sessionId: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ stripeSessionId: input.sessionId, checkoutCreatedAt: new Date(), expiresAt: input.expiresAt }).where(eq(orders.id, input.orderId));
    await tx.update(payments).set({ externalSessionId: input.sessionId, status: "processing" }).where(eq(payments.id, input.paymentId));
  });
}

export async function getCommerceOrder(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result[0];
}

export async function getCommerceOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getPaymentByOrder(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.orderId, orderId)).orderBy(desc(payments.createdAt)).limit(1);
  return result[0];
}

export async function getPaymentById(paymentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  return result[0];
}

export async function getPaymentBySession(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.externalSessionId, sessionId)).limit(1);
  return result[0];
}

export async function getPaymentByIntent(paymentIntentId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.externalPaymentIntentId, paymentIntentId)).orderBy(desc(payments.createdAt)).limit(1);
  return result[0];
}

export async function updateCommerceOrderStatus(orderId: number, status: OrderStatus, extra: Partial<typeof orders.$inferInsert> = {}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const timestampField = status === "paid" ? { paidAt: new Date() }
    : status === "failed" ? { failedAt: new Date() }
      : status === "cancelled" ? { cancelledAt: new Date() }
        : status === "refunded" ? { refundedAt: new Date() }
          : status === "chargeback" ? { chargebackAt: new Date() } : {};
  await db.update(orders).set({ status, ...timestampField, ...extra }).where(eq(orders.id, orderId));
}

export async function updateCommercePayment(paymentId: number, data: Partial<typeof payments.$inferInsert> & { status?: PaymentStatus }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(payments).set(data).where(eq(payments.id, paymentId));
}

export async function activatePaidEntitlements(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(licenses).set({ status: "awaiting_vendor" }).where(and(eq(licenses.orderId, orderId), eq(licenses.status, "pending_payment")));
}

export async function revokeOrderLicenses(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(licenses).set({ status: "revoked" }).where(eq(licenses.orderId, orderId));
}

export async function getOrderLicenses(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenses).where(eq(licenses.orderId, orderId));
}

export async function getOrderInvoice(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.orderId, orderId)).limit(1);
  return result[0];
}

export async function getUserCommerceOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getAllCommerceOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderInternalNotes(orderId: number, internalNotes: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(orders).set({ internalNotes }).where(eq(orders.id, orderId));
}

export async function fulfillLicense(input: { licenseId: number; encryptedKey: string | null; keyLast4: string | null; downloadUrl: string | null; installationInstructions: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(licenses).set({
    status: "active",
    licenseKeyEncrypted: input.encryptedKey,
    licenseKeyLast4: input.keyLast4,
    downloadUrl: input.downloadUrl,
    installationInstructions: input.installationInstructions,
    activatedAt: new Date(),
    deliveredAt: new Date(),
  }).where(eq(licenses.id, input.licenseId));
}

export async function getLicenseById(licenseId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(licenses).where(eq(licenses.id, licenseId)).limit(1);
  return result[0];
}

export async function createWebhookEvent(input: { provider: "stripe" | "nfeio" | "focus" | "enotas"; eventId: string; eventType: string; payloadHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  try {
    const result = await db.insert(webhookEvents).values({ ...input, status: "processing", attempts: 1 });
    return { inserted: true, id: Number((result[0] as { insertId: number }).insertId) };
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      const existing = await db.select().from(webhookEvents).where(eq(webhookEvents.eventId, input.eventId)).limit(1);
      const current = existing[0];
      if (current?.status === "failed" && current.attempts < 5) {
        await db.update(webhookEvents).set({ status: "processing", attempts: current.attempts + 1, errorMessage: null, processedAt: null }).where(eq(webhookEvents.id, current.id));
        return { inserted: true, id: current.id, retry: true };
      }
      return { inserted: false, id: current?.id || 0 };
    }
    throw error;
  }
}

export async function completeWebhookEvent(id: number, data: { status: "processed" | "ignored" | "failed"; orderId?: number | null; paymentId?: number | null; errorMessage?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(webhookEvents).set({ ...data, processedAt: new Date() }).where(eq(webhookEvents.id, id));
}

export async function createCommerceMessage(input: typeof commerceMessages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const result = await db.insert(commerceMessages).values(input);
  return Number((result[0] as { insertId: number }).insertId);
}

export async function getCommerceMessage(messageId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(commerceMessages).where(eq(commerceMessages.id, messageId)).limit(1);
  return result[0];
}

export async function updateCommerceMessage(messageId: number, data: Partial<typeof commerceMessages.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(commerceMessages).set(data).where(eq(commerceMessages.id, messageId));
}

export async function updateInvoice(orderId: number, data: Partial<typeof invoices.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(invoices).set(data).where(eq(invoices.orderId, orderId));
}
