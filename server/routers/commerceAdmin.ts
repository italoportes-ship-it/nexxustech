import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as commerceDb from "../commerceDb";
import { fulfillVendorLicense, getSafeOrderDetails, markOrderCancelled } from "../commerceService";
import { queueAndSendOrderMessage } from "../commerceMessaging";
import { requestInvoiceForOrder } from "../fiscal";
import { expireCommerceCheckoutSession, refundCommercePayment } from "../stripe";

const orderStatuses = ["pending", "paid", "failed", "cancelled", "refunded", "chargeback"] as const;

export const adminCommerceRouter = router({
  list: adminProcedure.input(z.object({ status: z.enum(orderStatuses).optional() }).optional()).query(async ({ input }) => {
    const all = await commerceDb.getAllCommerceOrders();
    const filtered = input?.status ? all.filter((order) => order.status === input.status) : all;
    return Promise.all(filtered.map(async (order) => {
      const [payment, invoice, orderLicenses, items] = await Promise.all([
        commerceDb.getPaymentByOrder(order.id),
        commerceDb.getOrderInvoice(order.id),
        commerceDb.getOrderLicenses(order.id),
        commerceDb.getCommerceOrderItems(order.id),
      ]);
      return {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          currency: order.currency,
          totalAmount: order.totalAmount,
          customerEmail: order.customerEmail,
          paymentMethod: order.paymentMethod,
          internalNotes: order.internalNotes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          paidAt: order.paidAt,
        },
        payment: payment ? { id: payment.id, status: payment.status, method: payment.paymentMethod, confirmedAt: payment.confirmedAt, externalPaymentIntentId: payment.externalPaymentIntentId } : null,
        invoice: invoice ? { status: invoice.status, provider: invoice.provider, number: invoice.number } : null,
        licenses: orderLicenses.map((license) => ({ id: license.id, status: license.status, quantity: license.quantity, licenseKeyLast4: license.licenseKeyLast4 })),
        items,
      };
    }));
  }),
  details: adminProcedure.input(z.object({ orderId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const details = await getSafeOrderDetails(input.orderId, ctx.user.id, true);
    if (!details) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });
    return details;
  }),
  notes: adminProcedure.input(z.object({ orderId: z.number().int().positive(), internalNotes: z.string().max(4_000).nullable() })).mutation(async ({ input }) => {
    await commerceDb.updateOrderInternalNotes(input.orderId, input.internalNotes?.trim() || null);
    return { success: true };
  }),
  fulfillLicense: adminProcedure.input(z.object({
    licenseId: z.number().int().positive(),
    licenseKey: z.string().trim().max(1_000).nullable().optional(),
    downloadUrl: z.string().url().max(1_000).nullable().optional(),
    installationInstructions: z.string().max(10_000).nullable().optional(),
  })).mutation(async ({ input }) => {
    await fulfillVendorLicense(input);
    const license = await commerceDb.getLicenseById(input.licenseId);
    if (license) {
      const order = await commerceDb.getCommerceOrder(license.orderId);
      if (order?.customerEmail) await queueAndSendOrderMessage(order.id, "license_ready", order.customerEmail);
    }
    return { success: true };
  }),
  resendConfirmation: adminProcedure.input(z.object({ orderId: z.number().int().positive(), type: z.enum(["payment_confirmed", "license_ready", "invoice_ready"]) })).mutation(async ({ input }) => {
    const order = await commerceDb.getCommerceOrder(input.orderId);
    if (!order?.customerEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido sem e-mail do comprador." });
    return queueAndSendOrderMessage(order.id, input.type, order.customerEmail);
  }),
  requestInvoice: adminProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(({ input }) => requestInvoiceForOrder(input.orderId)),
  cancel: adminProcedure.input(z.object({ orderId: z.number().int().positive(), confirmation: z.literal("CANCELAR PEDIDO") })).mutation(async ({ input }) => {
    const order = await commerceDb.getCommerceOrder(input.orderId);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });
    if (order.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Somente pedidos pendentes podem ser cancelados." });
    if (order.stripeSessionId) await expireCommerceCheckoutSession(order.stripeSessionId);
    const payment = await commerceDb.getPaymentByOrder(order.id);
    await markOrderCancelled(order.id, payment?.id);
    return { success: true };
  }),
  refund: adminProcedure.input(z.object({ orderId: z.number().int().positive(), confirmation: z.literal("ESTORNAR PEDIDO") })).mutation(async ({ input }) => {
    const order = await commerceDb.getCommerceOrder(input.orderId);
    const payment = await commerceDb.getPaymentByOrder(input.orderId);
    if (!order || !payment) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido ou pagamento não encontrado." });
    if (order.status !== "paid" || !payment.externalPaymentIntentId) throw new TRPCError({ code: "BAD_REQUEST", message: "Somente pagamentos confirmados com PaymentIntent podem ser estornados." });
    const refund = await refundCommercePayment(payment.externalPaymentIntentId, order.id);
    return { success: true, refundId: refund.id, status: refund.status, message: "O pedido será atualizado somente pelo webhook de reembolso." };
  }),
});
