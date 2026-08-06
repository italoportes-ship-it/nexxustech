import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { calculateBrazilPricing, canPublishApprovedPrice } from "../pricingGovernance";

const priceInput = z.object({
  id: z.number().int().positive().optional(),
  productId: z.number().int().positive(),
  sourceType: z.enum(["public", "internal"]),
  planName: z.string().trim().min(1).max(255),
  minSeats: z.number().int().positive().default(1),
  maxSeats: z.number().int().positive().nullable().optional(),
  billingPeriod: z.enum(["monthly", "annual", "custom"]),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  sourceAmount: z.number().positive(),
  exchangeRate: z.number().positive().nullable().optional(),
  taxRate: z.number().min(0).max(99.99),
  operationalCostRate: z.number().min(0).max(99.99),
  marginRate: z.number().min(0).max(99),
  sourceLabel: z.string().trim().max(255).nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  notes: z.string().max(4_000).nullable().optional(),
});

export const productResourcesRouter = router({
  media: publicProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) =>
    db.getPublishedProductMedia(input.productId)
  ),
  publishedPrices: publicProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) =>
    db.getPublishedProductPrices(input.productId)
  ),
});

export const adminPricingRouter = router({
  list: adminProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) =>
    db.getAllProductPricesForAdmin(input.productId)
  ),
  media: adminProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) =>
    db.getAllProductMediaForAdmin(input.productId)
  ),
  saveDraft: adminProcedure.input(priceInput).mutation(async ({ input }) => {
    let calculation: ReturnType<typeof calculateBrazilPricing> | null = null;
    if (input.currency === "BRL" || input.exchangeRate) {
      calculation = calculateBrazilPricing({
        sourceAmount: input.sourceAmount,
        currency: input.currency,
        exchangeRate: input.exchangeRate,
        taxRate: input.taxRate,
        operationalCostRate: input.operationalCostRate,
        marginRate: input.marginRate,
      });
    }

    const values = {
      productId: input.productId,
      sourceType: input.sourceType,
      planName: input.planName,
      minSeats: input.minSeats,
      maxSeats: input.maxSeats ?? null,
      billingPeriod: input.billingPeriod,
      currency: input.currency,
      sourceAmount: input.sourceAmount.toFixed(4),
      exchangeRate: input.exchangeRate?.toFixed(6) ?? null,
      taxRate: input.taxRate.toFixed(4),
      operationalCostRate: input.operationalCostRate.toFixed(4),
      marginRate: input.marginRate.toFixed(4),
      calculatedCostBrl: calculation?.calculatedCostBrl.toFixed(2) ?? null,
      suggestedPriceBrl: calculation?.suggestedPriceBrl.toFixed(2) ?? null,
      approvedPriceBrl: null,
      status: "draft" as const,
      isPublic: false,
      sourceLabel: input.sourceLabel ?? null,
      sourceUrl: input.sourceUrl ?? null,
      notes: input.notes ?? null,
      approvedByUserId: null,
      approvedAt: null,
      publishedAt: null,
    };

    if (input.id) {
      await db.updateProductPrice(input.id, values);
      return { success: true, id: input.id, calculation };
    }
    const id = await db.createProductPrice(values);
    return { success: true, id, calculation };
  }),
  submitReview: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const price = await db.getProductPriceById(input.id);
    if (!price) throw new TRPCError({ code: "NOT_FOUND", message: "Preço não encontrado." });
    if (!price.suggestedPriceBrl) throw new TRPCError({ code: "BAD_REQUEST", message: "Calcule o preço sugerido antes de enviar para revisão." });
    await db.updateProductPrice(input.id, { status: "in_review", isPublic: false });
    return { success: true };
  }),
  approve: adminProcedure.input(z.object({
    id: z.number().int().positive(),
    approvedPriceBrl: z.number().positive(),
  })).mutation(async ({ ctx, input }) => {
    const price = await db.getProductPriceById(input.id);
    if (!price) throw new TRPCError({ code: "NOT_FOUND", message: "Preço não encontrado." });
    if (price.status !== "in_review") throw new TRPCError({ code: "BAD_REQUEST", message: "O preço precisa estar em revisão." });
    await db.updateProductPrice(input.id, {
      approvedPriceBrl: input.approvedPriceBrl.toFixed(2),
      status: "approved",
      approvedByUserId: ctx.user.id,
      approvedAt: new Date(),
      isPublic: false,
    });
    return { success: true };
  }),
  publish: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const price = await db.getProductPriceById(input.id);
    if (!price) throw new TRPCError({ code: "NOT_FOUND", message: "Preço não encontrado." });
    if (!canPublishApprovedPrice(price)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Somente preços homologados podem ser publicados." });
    }
    await db.updateProductPrice(input.id, { status: "published", isPublic: true, publishedAt: new Date() });
    return { success: true };
  }),
  unpublish: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const price = await db.getProductPriceById(input.id);
    if (!price) throw new TRPCError({ code: "NOT_FOUND", message: "Preço não encontrado." });
    await db.updateProductPrice(input.id, { status: "approved", isPublic: false, publishedAt: null });
    return { success: true };
  }),
});
