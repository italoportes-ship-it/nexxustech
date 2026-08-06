import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { adminProcedure, router } from "../_core/trpc";
import { calculateAdministrationPricing } from "../pricingGovernance";

const percentage = z.number().min(0).max(99.99);

const administrationInput = z.object({
  id: z.number().int().positive().optional(),
  productId: z.number().int().positive(),
  scenarioName: z.string().trim().min(3).max(255),
  planName: z.string().trim().min(1).max(255),
  sourceType: z.enum(["public", "internal"]),
  costPeriod: z.enum(["monthly", "annual", "custom"]),
  sourceCurrency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  listUnitCost: z.number().positive(),
  negotiatedUnitCost: z.number().positive().nullable().optional(),
  useNegotiatedCost: z.boolean(),
  quantity: z.number().int().positive(),
  periodMonths: z.number().int().min(1).max(120),
  dealDiscountRate: percentage,
  exchangeRate: z.number().positive(),
  exchangeSpreadRate: percentage,
  manufacturerAbsorbsIrrf: z.boolean(),
  irrfRate: percentage,
  cideRate: percentage,
  pisRate: percentage,
  cofinsRate: percentage,
  issRate: percentage,
  iofRate: percentage,
  otherTaxRate: percentage,
  financialCostRate: percentage,
  operationalCostRate: percentage,
  contingencyRate: percentage,
  minimumMarginRate: z.number().min(0).max(99),
  targetMarginRate: z.number().min(0).max(99),
  manualSalePriceBrl: z.number().positive().nullable().optional(),
  publicPlanName: z.string().trim().min(1).max(255),
  publicBillingPeriod: z.enum(["monthly", "annual", "custom"]),
  publicMinSeats: z.number().int().positive(),
  publicMaxSeats: z.number().int().positive().nullable().optional(),
  publicDescription: z.string().max(2_000).nullable().optional(),
  sourceLabel: z.string().max(255).nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  notes: z.string().max(4_000).nullable().optional(),
});

function calculationInput(input: z.infer<typeof administrationInput>) {
  return {
    costPeriod: input.costPeriod,
    sourceCurrency: input.sourceCurrency,
    listUnitCost: input.listUnitCost,
    negotiatedUnitCost: input.negotiatedUnitCost,
    useNegotiatedCost: input.useNegotiatedCost,
    quantity: input.quantity,
    periodMonths: input.periodMonths,
    dealDiscountRate: input.dealDiscountRate,
    exchangeRate: input.exchangeRate,
    exchangeSpreadRate: input.exchangeSpreadRate,
    manufacturerAbsorbsIrrf: input.manufacturerAbsorbsIrrf,
    irrfRate: input.irrfRate,
    cideRate: input.cideRate,
    pisRate: input.pisRate,
    cofinsRate: input.cofinsRate,
    issRate: input.issRate,
    iofRate: input.iofRate,
    otherTaxRate: input.otherTaxRate,
    financialCostRate: input.financialCostRate,
    operationalCostRate: input.operationalCostRate,
    contingencyRate: input.contingencyRate,
    minimumMarginRate: input.minimumMarginRate,
    targetMarginRate: input.targetMarginRate,
    manualSalePriceBrl: input.manualSalePriceBrl,
  };
}

function decimal(value: number, scale = 4) {
  return value.toFixed(scale);
}

export const adminAdministrationRouter = router({
  list: adminProcedure.input(z.object({ productId: z.number().int().positive().optional() }).optional()).query(({ input }) =>
    db.listPricingAdministration(input?.productId)
  ),
  get: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const scenario = await db.getPricingAdministrationById(input.id);
    if (!scenario) throw new TRPCError({ code: "NOT_FOUND", message: "Cenário administrativo não encontrado." });
    return scenario;
  }),
  simulate: adminProcedure.input(administrationInput.omit({ id: true })).mutation(({ input }) =>
    calculateAdministrationPricing(calculationInput(input))
  ),
  saveDraft: adminProcedure.input(administrationInput).mutation(async ({ ctx, input }) => {
    if (input.id) {
      const current = await db.getPricingAdministrationById(input.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Cenário não encontrado." });
      if (current.status === "published") throw new TRPCError({ code: "BAD_REQUEST", message: "Retire o preço publicado antes de editar o cenário." });
    }

    const result = calculateAdministrationPricing(calculationInput(input));
    const values = {
      productId: input.productId,
      scenarioName: input.scenarioName,
      planName: input.planName,
      sourceType: input.sourceType,
      costPeriod: input.costPeriod,
      sourceCurrency: input.sourceCurrency,
      listUnitCost: decimal(input.listUnitCost),
      negotiatedUnitCost: input.negotiatedUnitCost ? decimal(input.negotiatedUnitCost) : null,
      useNegotiatedCost: input.useNegotiatedCost,
      quantity: input.quantity,
      periodMonths: input.periodMonths,
      dealDiscountRate: decimal(input.dealDiscountRate),
      exchangeRate: decimal(input.exchangeRate, 6),
      exchangeSpreadRate: decimal(input.exchangeSpreadRate),
      manufacturerAbsorbsIrrf: input.manufacturerAbsorbsIrrf,
      irrfRate: decimal(input.irrfRate),
      cideRate: decimal(input.cideRate),
      pisRate: decimal(input.pisRate),
      cofinsRate: decimal(input.cofinsRate),
      issRate: decimal(input.issRate),
      iofRate: decimal(input.iofRate),
      otherTaxRate: decimal(input.otherTaxRate),
      financialCostRate: decimal(input.financialCostRate),
      operationalCostRate: decimal(input.operationalCostRate),
      contingencyRate: decimal(input.contingencyRate),
      minimumMarginRate: decimal(input.minimumMarginRate),
      targetMarginRate: decimal(input.targetMarginRate),
      manualSalePriceBrl: input.manualSalePriceBrl ? input.manualSalePriceBrl.toFixed(2) : null,
      grossForeignCost: result.grossForeignCost.toFixed(2),
      netForeignCost: result.netForeignCost.toFixed(2),
      baseCostBrl: result.baseCostBrl.toFixed(2),
      taxesBrl: result.taxesBrl.toFixed(2),
      totalCostBrl: result.totalCostBrl.toFixed(2),
      minimumPriceBrl: result.minimumPriceBrl.toFixed(2),
      suggestedPriceBrl: result.suggestedPriceBrl.toFixed(2),
      finalSalePriceBrl: result.finalSalePriceBrl.toFixed(2),
      unitSalePriceBrl: result.unitSalePriceBrl.toFixed(2),
      contributionBrl: result.contributionBrl.toFixed(2),
      contributionRate: decimal(result.contributionRate),
      markupRate: decimal(result.markupRate),
      publicPlanName: input.publicPlanName,
      publicBillingPeriod: input.publicBillingPeriod,
      publicMinSeats: input.publicMinSeats,
      publicMaxSeats: input.publicMaxSeats ?? null,
      publicDescription: input.publicDescription ?? null,
      sourceLabel: input.sourceLabel ?? null,
      sourceUrl: input.sourceUrl ?? null,
      notes: input.notes ?? null,
      status: "draft" as const,
      approvedByUserId: null,
      approvedAt: null,
      publishedAt: null,
      withdrawnAt: null,
    };

    if (input.id) {
      await db.updatePricingAdministration(input.id, values);
      return { success: true, id: input.id, result };
    }
    const id = await db.createPricingAdministration({ ...values, createdByUserId: ctx.user.id });
    return { success: true, id, result };
  }),
  submitReview: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const scenario = await db.getPricingAdministrationById(input.id);
    if (!scenario) throw new TRPCError({ code: "NOT_FOUND", message: "Cenário não encontrado." });
    if (scenario.status !== "draft" && scenario.status !== "withdrawn") throw new TRPCError({ code: "BAD_REQUEST", message: "Somente rascunhos podem ser enviados para revisão." });
    await db.updatePricingAdministration(input.id, { status: "in_review" });
    return { success: true };
  }),
  approve: adminProcedure.input(z.object({ id: z.number().int().positive(), allowBelowMinimum: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    const scenario = await db.getPricingAdministrationById(input.id);
    if (!scenario) throw new TRPCError({ code: "NOT_FOUND", message: "Cenário não encontrado." });
    if (scenario.status !== "in_review") throw new TRPCError({ code: "BAD_REQUEST", message: "O cenário precisa estar em revisão." });
    if (!scenario.finalSalePriceBrl) throw new TRPCError({ code: "BAD_REQUEST", message: "O cenário não possui preço final calculado." });
    if (!input.allowBelowMinimum && Number(scenario.finalSalePriceBrl) < Number(scenario.minimumPriceBrl || 0)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "O preço final está abaixo do mínimo. Confirme a exceção estratégica para aprovar." });
    }
    await db.updatePricingAdministration(input.id, { status: "approved", approvedByUserId: ctx.user.id, approvedAt: new Date() });
    return { success: true };
  }),
  publish: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const scenario = await db.getPricingAdministrationById(input.id);
    if (!scenario) throw new TRPCError({ code: "NOT_FOUND", message: "Cenário não encontrado." });
    if (scenario.status !== "approved" || !scenario.approvedByUserId || !scenario.approvedAt) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Somente um cenário homologado pode ser publicado." });
    }
    const finalPrice = Number(scenario.finalSalePriceBrl);
    if (!Number.isFinite(finalPrice) || finalPrice <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Preço final inválido." });

    const publicValues = {
      productId: scenario.productId,
      sourceType: "internal" as const,
      planName: scenario.publicPlanName || scenario.planName,
      minSeats: scenario.publicMinSeats,
      maxSeats: scenario.publicMaxSeats,
      billingPeriod: scenario.publicBillingPeriod,
      currency: "BRL",
      sourceAmount: finalPrice.toFixed(4),
      exchangeRate: null,
      taxRate: "0.0000",
      operationalCostRate: "0.0000",
      marginRate: "0.0000",
      calculatedCostBrl: null,
      suggestedPriceBrl: null,
      approvedPriceBrl: finalPrice.toFixed(2),
      status: "published" as const,
      isPublic: true,
      sourceLabel: "Preço final homologado pela Administração",
      sourceUrl: null,
      effectiveFrom: new Date(),
      effectiveTo: null,
      approvedByUserId: scenario.approvedByUserId,
      approvedAt: scenario.approvedAt,
      publishedAt: new Date(),
      notes: scenario.publicDescription,
    };

    let productPriceId = scenario.productPriceId;
    if (productPriceId) await db.updateProductPrice(productPriceId, publicValues);
    else productPriceId = await db.createProductPrice(publicValues);
    await db.updatePricingAdministration(input.id, { status: "published", productPriceId, publishedAt: new Date(), withdrawnAt: null });
    return { success: true, productPriceId };
  }),
  withdraw: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const scenario = await db.getPricingAdministrationById(input.id);
    if (!scenario) throw new TRPCError({ code: "NOT_FOUND", message: "Cenário não encontrado." });
    if (scenario.status !== "published") throw new TRPCError({ code: "BAD_REQUEST", message: "Somente preços publicados podem ser retirados." });
    if (scenario.productPriceId) await db.updateProductPrice(scenario.productPriceId, { status: "approved", isPublic: false, publishedAt: null });
    await db.updatePricingAdministration(input.id, { status: "withdrawn", withdrawnAt: new Date() });
    return { success: true };
  }),
});
