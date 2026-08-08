import Stripe from "stripe";
import { Request, Response } from "express";
import * as commerceDb from "./commerceDb";
import { markOrderCancelled, markOrderChargeback, markOrderFailed, markOrderPaid, markOrderRefunded } from "./commerceService";
import { sha256 } from "./commerceSecurity";
import { queueAndSendOrderMessage } from "./commerceMessaging";
import { requestInvoiceForOrder } from "./fiscal";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil" as any,
});

export async function createCommerceCheckoutSession(input: {
  orderId: number;
  paymentId: number;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  userId: number;
  items: Array<{ name: string; description?: string | null; unitAmountBrl: number; quantity: number }>;
  origin: string;
  stripeCustomerId?: string | null;
}) {
  const expiresAt = new Date(Date.now() + (23 * 60 + 55) * 60 * 1000);
  const metadata = {
    order_id: input.orderId.toString(),
    payment_id: input.paymentId.toString(),
    order_number: input.orderNumber,
    user_id: input.userId.toString(),
    customer_email: input.customerEmail,
    customer_name: input.customerName,
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: input.items.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: { name: item.name, description: item.description || undefined },
        unit_amount: Math.round(item.unitAmountBrl * 100),
      },
      quantity: item.quantity,
    })),
    success_url: `${input.origin}/checkout/processando?session_id={CHECKOUT_SESSION_ID}&order=${input.orderId}`,
    cancel_url: `${input.origin}/checkout/cancelado?order=${input.orderId}`,
    customer: input.stripeCustomerId || undefined,
    customer_email: input.stripeCustomerId ? undefined : input.customerEmail,
    customer_creation: input.stripeCustomerId ? undefined : "always",
    client_reference_id: input.userId.toString(),
    allow_promotion_codes: true,
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    tax_id_collection: { enabled: true },
    locale: "pt-BR",
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    metadata,
    payment_intent_data: { metadata },
  }, {
    idempotencyKey: `checkout_order_${input.orderId}`,
  });

  if (!session.url) throw new Error("Stripe não retornou URL de checkout.");
  await commerceDb.attachStripeSession({ orderId: input.orderId, paymentId: input.paymentId, sessionId: session.id, expiresAt });
  return { url: session.url, sessionId: session.id, expiresAt };
}

export async function retrieveCheckoutSessionUrl(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.status === "expired") return null;
  return session.url || null;
}

export async function expireCommerceCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.status === "open") await stripe.checkout.sessions.expire(sessionId);
  return { expired: session.status === "open" || session.status === "expired" };
}

export async function refundCommercePayment(paymentIntentId: string, orderId: number) {
  return stripe.refunds.create({ payment_intent: paymentIntentId, reason: "requested_by_customer", metadata: { order_id: orderId.toString() } }, { idempotencyKey: `refund_order_${orderId}` });
}

function idFromMetadata(metadata?: Stripe.Metadata | null, field = "order_id") {
  const value = Number(metadata?.[field] || 0);
  return Number.isInteger(value) && value > 0 ? value : 0;
}

async function resolvePayment(input: { paymentId?: number; sessionId?: string; paymentIntentId?: string }) {
  if (input.paymentId) {
    const byId = await commerceDb.getPaymentById(input.paymentId);
    if (byId) return byId;
  }
  if (input.sessionId) {
    const bySession = await commerceDb.getPaymentBySession(input.sessionId);
    if (bySession) return bySession;
  }
  if (input.paymentIntentId) return commerceDb.getPaymentByIntent(input.paymentIntentId);
  return undefined;
}

async function processSessionPaid(session: Stripe.Checkout.Session) {
  const orderId = idFromMetadata(session.metadata);
  const paymentId = idFromMetadata(session.metadata, "payment_id");
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const payment = await resolvePayment({ paymentId, sessionId: session.id, paymentIntentId: paymentIntentId || undefined });
  if (!orderId || !payment || payment.orderId !== orderId) throw new Error("Metadados de pagamento inconsistentes.");
  const paid = await markOrderPaid({
    orderId,
    paymentId: payment.id,
    sessionId: session.id,
    paymentIntentId: paymentIntentId || null,
    paymentMethod: session.payment_method_types?.join(",") || null,
    amountTotal: (session.amount_total || 0) / 100,
    currency: session.currency || "brl",
  });
  if (!paid.alreadyPaid) {
    const order = await commerceDb.getCommerceOrder(orderId);
    if (order?.customerEmail) await queueAndSendOrderMessage(orderId, "payment_confirmed", order.customerEmail);
    await requestInvoiceForOrder(orderId);
  }
  return { orderId, paymentId: payment.id };
}

async function processPaymentIntentPaid(intent: Stripe.PaymentIntent) {
  const orderId = idFromMetadata(intent.metadata);
  const paymentId = idFromMetadata(intent.metadata, "payment_id");
  const payment = await resolvePayment({ paymentId, paymentIntentId: intent.id });
  if (!orderId || !payment || payment.orderId !== orderId) throw new Error("PaymentIntent sem vínculo de pedido válido.");
  const chargeId = typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id;
  const paid = await markOrderPaid({
    orderId,
    paymentId: payment.id,
    paymentIntentId: intent.id,
    chargeId: chargeId || null,
    paymentMethod: intent.payment_method_types.join(","),
    amountTotal: intent.amount_received / 100,
    currency: intent.currency,
  });
  if (!paid.alreadyPaid) {
    const order = await commerceDb.getCommerceOrder(orderId);
    if (order?.customerEmail) await queueAndSendOrderMessage(orderId, "payment_confirmed", order.customerEmail);
    await requestInvoiceForOrder(orderId);
  }
  return { orderId, paymentId: payment.id };
}

export async function processStripeEvent(event: Stripe.Event, payloadHash: string) {
  const eventRecord = await commerceDb.createWebhookEvent({ provider: "stripe", eventId: event.id, eventType: event.type, payloadHash });
  if (!eventRecord.inserted) return { duplicate: true, eventId: event.id };

  try {
    let result: { orderId?: number; paymentId?: number } = {};
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = idFromMetadata(session.metadata, "user_id");
        const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (userId && stripeCustomerId) await commerceDb.updateCheckoutCustomerStripeId(userId, stripeCustomerId);
        if (session.payment_status === "paid") result = await processSessionPaid(session);
        else {
          const orderId = idFromMetadata(session.metadata);
          const paymentId = idFromMetadata(session.metadata, "payment_id");
          const payment = await resolvePayment({ paymentId, sessionId: session.id });
          const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
          if (payment) await commerceDb.updateCommercePayment(payment.id, { status: "processing", externalSessionId: session.id, externalPaymentIntentId: paymentIntentId || null, paymentMethod: session.payment_method_types?.join(",") || null });
          result = { orderId: orderId || undefined, paymentId: payment?.id };
        }
        break;
      }
      case "checkout.session.async_payment_succeeded":
        result = await processSessionPaid(event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.succeeded":
        result = await processPaymentIntentPaid(event.data.object as Stripe.PaymentIntent);
        break;
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const payment = await resolvePayment({ paymentId: idFromMetadata(session.metadata, "payment_id"), sessionId: session.id });
        if (payment) await markOrderFailed({ orderId: payment.orderId, paymentId: payment.id, message: "Pagamento assíncrono recusado." });
        result = { orderId: payment?.orderId, paymentId: payment?.id };
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const payment = await resolvePayment({ paymentId: idFromMetadata(intent.metadata, "payment_id"), paymentIntentId: intent.id });
        if (payment) await markOrderFailed({ orderId: payment.orderId, paymentId: payment.id, code: intent.last_payment_error?.code, message: intent.last_payment_error?.message });
        result = { orderId: payment?.orderId, paymentId: payment?.id };
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const payment = await resolvePayment({ paymentId: idFromMetadata(session.metadata, "payment_id"), sessionId: session.id });
        const orderId = idFromMetadata(session.metadata) || payment?.orderId || 0;
        if (orderId) await markOrderCancelled(orderId, payment?.id);
        result = { orderId: orderId || undefined, paymentId: payment?.id };
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        const payment = paymentIntentId ? await commerceDb.getPaymentByIntent(paymentIntentId) : undefined;
        if (payment && charge.amount_refunded >= charge.amount) await markOrderRefunded(payment.orderId, payment.id);
        result = { orderId: payment?.orderId, paymentId: payment?.id };
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const charge = typeof dispute.charge === "string" ? await stripe.charges.retrieve(dispute.charge) : dispute.charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        const payment = paymentIntentId ? await commerceDb.getPaymentByIntent(paymentIntentId) : undefined;
        if (payment) await markOrderChargeback(payment.orderId, payment.id);
        result = { orderId: payment?.orderId, paymentId: payment?.id };
        break;
      }
      default:
        await commerceDb.completeWebhookEvent(eventRecord.id, { status: "ignored" });
        return { duplicate: false, ignored: true, eventId: event.id };
    }

    await commerceDb.completeWebhookEvent(eventRecord.id, { status: "processed", orderId: result.orderId || null, paymentId: result.paymentId || null });
    return { duplicate: false, ignored: false, eventId: event.id, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await commerceDb.completeWebhookEvent(eventRecord.id, { status: "failed", errorMessage: message.slice(0, 1000) });
    throw error;
  }
}

export function registerStripeWebhook(app: any) {
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!signature || !webhookSecret) return res.status(400).json({ error: "Webhook não configurado." });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
      console.error("[Stripe Webhook] Assinatura inválida:", error instanceof Error ? error.message : String(error));
      return res.status(400).json({ error: "Assinatura inválida." });
    }

    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    try {
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
      const result = await processStripeEvent(event, sha256(rawBody.toString("base64")));
      return res.json({ received: true, duplicate: result.duplicate });
    } catch (error) {
      console.error("[Stripe Webhook] Falha no processamento:", error);
      return res.status(500).json({ error: "Falha temporária no processamento." });
    }
  });
}
