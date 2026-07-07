import Stripe from "stripe";
import { Request, Response } from "express";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { sendOrderToCRM } from "./crm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil" as any,
});

export async function createCheckoutSession(userId: number, userEmail: string | null, userName: string | null, orderId: number, items: { name: string; price: number; quantity: number }[], origin: string) {
  const lineItems = items.map((item) => ({
    price_data: {
      currency: "brl",
      product_data: {
        name: item.name,
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${origin}/conta?payment=success&order=${orderId}`,
    cancel_url: `${origin}/checkout/${orderId}?payment=cancelled`,
    customer_email: userEmail || undefined,
    client_reference_id: userId.toString(),
    allow_promotion_codes: true,
    metadata: {
      user_id: userId.toString(),
      order_id: orderId.toString(),
      customer_email: userEmail || "",
      customer_name: userName || "",
    },
  });

  // Update order with stripe session id
  await db.updateOrderStatus(orderId, "pending", session.id);

  return session.url;
}

export function registerStripeWebhook(app: any) {
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    // Handle events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = parseInt(session.metadata?.order_id || "0");
        const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

        if (orderId > 0) {
          await db.updateOrderStatus(orderId, "paid", session.id, paymentIntentId || undefined);
          
          // Notify owner about successful payment
          const customerName = session.metadata?.customer_name || session.customer_email || "Cliente";
          const amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : "N/A";
          
          await notifyOwner({
            title: `Pagamento Confirmado - Pedido #${orderId}`,
            content: `O pagamento do pedido #${orderId} foi confirmado!\nCliente: ${customerName}\nE-mail: ${session.customer_email || 'N/A'}\nValor: R$ ${amount}\nID Stripe: ${session.id}`,
          });

          // Send confirmed order to CRM
          const orderItems = await db.getOrderItems(orderId);
          await sendOrderToCRM({
            orderId,
            customerName,
            customerEmail: session.customer_email || session.metadata?.customer_email || "",
            totalAmount: amount,
            items: orderItems.map(i => i.productName),
          });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = parseInt(paymentIntent.metadata?.order_id || "0");
        if (orderId > 0) {
          await db.updateOrderStatus(orderId, "failed");
        }
        break;
      }
    }

    res.json({ received: true });
  });
}
