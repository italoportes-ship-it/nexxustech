import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as commerceDb from "../commerceDb";
import { getCheckoutBuyerProfile, getSafeOrderDetails, prepareCheckoutOrder } from "../commerceService";
import { createCommerceCheckoutSession, retrieveCheckoutSessionUrl } from "../stripe";

const buyerSchema = z.object({
  customerType: z.enum(["person", "company"]),
  fullName: z.string().trim().min(3).max(255),
  legalName: z.string().trim().max(255).nullable().optional(),
  email: z.string().trim().email().max(320),
  taxId: z.string().trim().min(11).max(18),
  phone: z.string().trim().min(8).max(30),
  address: z.object({
    postalCode: z.string().trim().min(8).max(10),
    street: z.string().trim().min(2).max(255),
    number: z.string().trim().min(1).max(30),
    complement: z.string().trim().max(100).nullable().optional(),
    neighborhood: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(120),
    cityCode: z.string().trim().regex(/^\d{7}$/).nullable().optional(),
    state: z.string().trim().length(2),
    country: z.literal("BRA"),
  }),
});

function clientIp(req: any) {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || null;
  return req.ip || req.socket?.remoteAddress || null;
}

function safeOrigin(req: any) {
  const configured = process.env.PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "").split(",")[0].trim();
  const allowed = host === "nexxustech.one" || host === "www.nexxustech.one" || host === "nexxusapp-dayfmj3q.manus.space" || host.startsWith("localhost:") || host.endsWith(".manus.computer");
  if (!allowed) throw new TRPCError({ code: "BAD_REQUEST", message: "Origem de checkout inválida." });
  const protocol = String(req.headers?.["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
  return `${protocol}://${host}`;
}

export const checkoutRouter = router({
  profile: protectedProcedure.query(({ ctx }) => getCheckoutBuyerProfile(ctx.user.id)),
  quote: protectedProcedure.input(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(10_000) })).query(async ({ input }) => {
    const product = await commerceDb.getCheckoutProduct(input.productId);
    const price = await commerceDb.getPublishedCheckoutPrice(input.productId, input.quantity);
    if (!product || !price?.approvedPriceBrl) throw new TRPCError({ code: "NOT_FOUND", message: "Não existe preço homologado para esta quantidade." });
    const unitPrice = Number(price.approvedPriceBrl);
    return {
      product: { id: product.id, name: product.name, slug: product.slug, imageUrl: product.imageUrl, licensing: product.licensing },
      price: { id: price.id, planName: price.planName, unitPrice, quantity: input.quantity, total: unitPrice * input.quantity, currency: "BRL", billingPeriod: price.billingPeriod },
    };
  }),
  create: protectedProcedure.input(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(10_000),
    requestId: z.string().uuid(),
    buyer: buyerSchema,
    acceptTerms: z.literal(true),
    acceptPrivacy: z.literal(true),
  })).mutation(async ({ ctx, input }) => {
    const prepared = await prepareCheckoutOrder({
      user: ctx.user,
      buyer: input.buyer,
      item: { productId: input.productId, quantity: input.quantity },
      requestId: input.requestId,
      ipAddress: clientIp(ctx.req),
      userAgent: ctx.req.headers["user-agent"] || null,
    });

    if (prepared.existing) {
      if (prepared.order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Pedido inválido." });
      if (prepared.order.stripeSessionId) {
        const url = await retrieveCheckoutSessionUrl(prepared.order.stripeSessionId);
        if (url) return { orderId: prepared.order.id, orderNumber: prepared.order.orderNumber, checkoutUrl: url, existing: true };
      }
      throw new TRPCError({ code: "CONFLICT", message: "O pedido já existe e precisa ser retomado pela área do cliente." });
    }

    const customer = await commerceDb.getCheckoutCustomerByUserId(ctx.user.id);
    const session = await createCommerceCheckoutSession({
      orderId: prepared.order.id,
      paymentId: prepared.paymentId,
      orderNumber: prepared.order.orderNumber || `Pedido #${prepared.order.id}`,
      customerEmail: prepared.customer.email,
      customerName: prepared.customer.legalName || prepared.customer.fullName,
      userId: ctx.user.id,
      items: [{
        name: prepared.item.product.name,
        description: prepared.item.price.planName,
        unitAmountBrl: prepared.item.unitPrice,
        quantity: prepared.item.quantity,
      }],
      origin: safeOrigin(ctx.req),
      stripeCustomerId: customer?.stripeCustomerId || null,
    });

    return { orderId: prepared.order.id, orderNumber: prepared.order.orderNumber, checkoutUrl: session.url, existing: false };
  }),
  details: protectedProcedure.input(z.object({ orderId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const details = await getSafeOrderDetails(input.orderId, ctx.user.id);
    if (!details) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });
    return details;
  }),
  resume: protectedProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const order = await commerceDb.getCommerceOrder(input.orderId);
    if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });
    if (order.status !== "pending" || !order.stripeSessionId) throw new TRPCError({ code: "BAD_REQUEST", message: "Este pedido não possui checkout pendente." });
    const url = await retrieveCheckoutSessionUrl(order.stripeSessionId);
    if (!url) throw new TRPCError({ code: "BAD_REQUEST", message: "A sessão de pagamento expirou. Crie um novo pedido." });
    return { checkoutUrl: url };
  }),
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    const userOrders = await commerceDb.getUserCommerceOrders(ctx.user.id);
    return Promise.all(userOrders.map(async (order) => {
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
          subtotalAmount: order.subtotalAmount,
          discountAmount: order.discountAmount,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          paidAt: order.paidAt,
          expiresAt: order.expiresAt,
        },
        payment: payment ? { status: payment.status, method: payment.paymentMethod, confirmedAt: payment.confirmedAt } : null,
        invoice: invoice ? { status: invoice.status, number: invoice.number, pdfUrl: invoice.status === "issued" ? invoice.pdfUrl : null } : null,
        licenses: orderLicenses.map((license) => ({ id: license.id, status: license.status, quantity: license.quantity, productId: license.productId })),
        items,
      };
    }));
  }),
});
