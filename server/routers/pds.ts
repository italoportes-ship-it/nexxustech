import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { adminProcedure, router } from "../_core/trpc";
import {
  PDS_MODEL_ID,
  analyzePdsText,
  approvedProductPatch,
  buildPdsPreview,
  decodePdsFile,
  extractPdsText,
  parseStructuredPdsText,
  slugifyProductName,
  storePdsFile,
  type ParsedPds,
  type PdsPreview,
} from "../pdsService";

function parseJson<T>(value: string | null, label: string): T {
  if (!value) throw new TRPCError({ code: "BAD_REQUEST", message: `${label} não está disponível.` });
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `${label} está corrompido.` });
  }
}

export const adminPdsRouter = router({
  list: adminProcedure.query(() => db.listPdsImports()),
  detail: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const item = await db.getPdsImportById(input.id);
    if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Importação não encontrada." });
    const logs = await db.getPdsAuditLogs(input.id);
    return { item, logs };
  }),
  uploadAndAnalyze: adminProcedure.input(z.object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(100),
    base64: z.string().min(1).max(7_500_000),
  })).mutation(async ({ ctx, input }) => {
    const decoded = decodePdsFile(input);
    const duplicate = await db.getPdsImportByHash(decoded.hash);
    if (duplicate && duplicate.status !== "failed" && duplicate.status !== "rejected") {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Este arquivo já foi importado no registro #${duplicate.id}.`,
      });
    }

    const stored = await storePdsFile({ fileName: decoded.fileName, mimeType: input.mimeType, buffer: decoded.buffer });
    const importId = await db.createPdsImport({
      fileName: decoded.fileName,
      fileType: input.mimeType,
      fileKey: stored.key,
      fileUrl: stored.url,
      fileHash: decoded.hash,
      modelId: PDS_MODEL_ID,
      status: "analyzing",
      createdByUserId: ctx.user.id,
    });
    await db.createPdsAuditLog({ pdsImportId: importId, action: "upload", actorUserId: ctx.user.id, details: JSON.stringify({ fileName: decoded.fileName, size: decoded.buffer.length }) });

    try {
      const extractedText = await extractPdsText(decoded.fileName, decoded.buffer);
      await db.updatePdsImport(importId, { extractedText });
      let parsed: ParsedPds;
      let analysisMode: "ai" | "structured-fallback" = "ai";
      try {
        parsed = await analyzePdsText(extractedText);
      } catch (aiError) {
        analysisMode = "structured-fallback";
        parsed = parseStructuredPdsText(extractedText);
        parsed.warnings.unshift(`Análise por IA indisponível; fallback estruturado utilizado: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
      }
      const proposedSlug = parsed.product.slug || slugifyProductName(parsed.product.name);
      const existingProduct = proposedSlug ? await db.getProductBySlugIncludingInactive(proposedSlug) : undefined;
      const fallbackExisting = existingProduct || (parsed.product.name.toLowerCase() === "ampler" ? await db.getProductBySlugIncludingInactive("ampler") : undefined);
      const preview = buildPdsPreview(parsed, fallbackExisting);

      await db.updatePdsImport(importId, {
        productId: fallbackExisting?.id ?? null,
        modelId: analysisMode === "ai" ? PDS_MODEL_ID : "structured-fallback",
        extractedText,
        parsedData: JSON.stringify(parsed),
        changePreview: JSON.stringify(preview),
        warnings: JSON.stringify([...parsed.warnings, ...parsed.pendingValidation]),
        status: "review",
        errorMessage: null,
      });
      await db.createPdsAuditLog({ pdsImportId: importId, action: "analyze", actorUserId: ctx.user.id, details: JSON.stringify({ model: analysisMode === "ai" ? PDS_MODEL_ID : "structured-fallback", confidenceScore: parsed.confidenceScore, changes: preview.changes.length }) });
      return { success: true, id: importId, parsed, preview, analysisMode };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha desconhecida na análise.";
      await db.updatePdsImport(importId, { status: "failed", errorMessage: message });
      await db.createPdsAuditLog({ pdsImportId: importId, action: "fail", actorUserId: ctx.user.id, details: message });
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
    }
  }),
  retryAnalyze: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const item = await db.getPdsImportById(input.id);
    if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Importação não encontrada." });
    const canRetry = item.status === "failed" || (item.status === "review" && item.modelId === "structured-fallback");
    if (!canRetry) throw new TRPCError({ code: "BAD_REQUEST", message: "Somente falhas ou prévias geradas pelo fallback podem ser reanalisadas." });
    if (!item.extractedText) throw new TRPCError({ code: "BAD_REQUEST", message: "O texto extraído não foi preservado; envie o arquivo novamente." });

    await db.updatePdsImport(input.id, { status: "analyzing", errorMessage: null });
    try {
      const parsed = await analyzePdsText(item.extractedText);
      const proposedSlug = parsed.product.slug || slugifyProductName(parsed.product.name);
      const existingProduct = proposedSlug ? await db.getProductBySlugIncludingInactive(proposedSlug) : undefined;
      const fallbackExisting = existingProduct || (parsed.product.name.toLowerCase() === "ampler" ? await db.getProductBySlugIncludingInactive("ampler") : undefined);
      const preview = buildPdsPreview(parsed, fallbackExisting);
      await db.updatePdsImport(input.id, {
        productId: fallbackExisting?.id ?? null,
        modelId: PDS_MODEL_ID,
        parsedData: JSON.stringify(parsed),
        changePreview: JSON.stringify(preview),
        warnings: JSON.stringify([...parsed.warnings, ...parsed.pendingValidation]),
        status: "review",
        errorMessage: null,
      });
      await db.createPdsAuditLog({ pdsImportId: input.id, action: "analyze", actorUserId: ctx.user.id, details: JSON.stringify({ retry: true, model: PDS_MODEL_ID, confidenceScore: parsed.confidenceScore, changes: preview.changes.length }) });
      return { success: true, parsed, preview, analysisMode: "ai" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha desconhecida na análise.";
      try {
        const parsed = parseStructuredPdsText(item.extractedText);
        parsed.warnings.unshift(`Reanálise por IA indisponível; prévia fallback preservada: ${message}`);
        const proposedSlug = parsed.product.slug || slugifyProductName(parsed.product.name);
        const existingProduct = proposedSlug ? await db.getProductBySlugIncludingInactive(proposedSlug) : undefined;
        const fallbackExisting = existingProduct || (parsed.product.name.toLowerCase() === "ampler" ? await db.getProductBySlugIncludingInactive("ampler") : undefined);
        const preview = buildPdsPreview(parsed, fallbackExisting);
        await db.updatePdsImport(input.id, {
          productId: fallbackExisting?.id ?? null,
          modelId: "structured-fallback",
          parsedData: JSON.stringify(parsed),
          changePreview: JSON.stringify(preview),
          warnings: JSON.stringify([...parsed.warnings, ...parsed.pendingValidation]),
          status: "review",
          errorMessage: null,
        });
        await db.createPdsAuditLog({ pdsImportId: input.id, action: "analyze", actorUserId: ctx.user.id, details: JSON.stringify({ retry: true, model: "structured-fallback", confidenceScore: parsed.confidenceScore, changes: preview.changes.length }) });
        return { success: true, parsed, preview, analysisMode: "structured-fallback" as const };
      } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        await db.updatePdsImport(input.id, { status: "failed", errorMessage: fallbackMessage });
        await db.createPdsAuditLog({ pdsImportId: input.id, action: "fail", actorUserId: ctx.user.id, details: fallbackMessage });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: fallbackMessage });
      }
    }
  }),
  reject: adminProcedure.input(z.object({ id: z.number().int().positive(), reason: z.string().trim().min(3).max(2_000) })).mutation(async ({ ctx, input }) => {
    const item = await db.getPdsImportById(input.id);
    if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Importação não encontrada." });
    if (item.status !== "review") throw new TRPCError({ code: "BAD_REQUEST", message: "Somente importações em revisão podem ser rejeitadas." });
    await db.updatePdsImport(input.id, { status: "rejected", reviewedByUserId: ctx.user.id, errorMessage: input.reason });
    await db.createPdsAuditLog({ pdsImportId: input.id, action: "reject", actorUserId: ctx.user.id, details: input.reason });
    return { success: true };
  }),
  approveAndApply: adminProcedure.input(z.object({
    id: z.number().int().positive(),
    confirmation: z.literal("APROVAR E APLICAR"),
    fields: z.array(z.string().min(1)).min(1).optional(),
  })).mutation(async ({ ctx, input }) => {
    const item = await db.getPdsImportById(input.id);
    if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Importação não encontrada." });
    if (item.status !== "review") throw new TRPCError({ code: "BAD_REQUEST", message: "A importação precisa estar em revisão." });

    const parsed = parseJson<ParsedPds>(item.parsedData, "Dados extraídos");
    const preview = parseJson<PdsPreview>(item.changePreview, "Prévia das alterações");
    const allowedPreviewFields = preview.changes.filter((change) => change.willApply).map((change) => change.field);
    const selectedFields = input.fields || allowedPreviewFields;
    if (selectedFields.some((field) => !allowedPreviewFields.includes(field))) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A seleção contém um campo não aprovado pela prévia." });
    }
    const existing = item.productId
      ? await db.getProductBySlugIncludingInactive(preview.targetSlug)
      : await db.getProductBySlugIncludingInactive(preview.targetSlug);

    await db.updatePdsImport(input.id, { status: "approved", reviewedByUserId: ctx.user.id, approvedAt: new Date() });
    await db.createPdsAuditLog({ pdsImportId: input.id, action: "approve", actorUserId: ctx.user.id, details: JSON.stringify({ confirmation: input.confirmation }) });

    let productId: number;
    if (existing) {
      const versions = await db.listProductVersions(existing.id);
      if (versions.length === 0) {
        await db.createProductVersion({ productId: existing.id, pdsImportId: null, snapshot: JSON.stringify(existing), createdByUserId: ctx.user.id });
      }
      const fullPatch = approvedProductPatch(parsed);
      const patch = Object.fromEntries(Object.entries(fullPatch).filter(([field]) => selectedFields.includes(field)));
      await db.updateProduct(existing.id, { ...patch, sourceDocument: item.fileName, lastPdsSyncAt: new Date() });
      productId = existing.id;
    } else {
      productId = await db.createProduct({
        name: parsed.product.name,
        slug: preview.targetSlug,
        description: parsed.product.longDescription,
        shortDescription: parsed.product.shortDescription,
        price: "0.00",
        categoryId: 3,
        type: "software",
        imageUrl: null,
        features: parsed.features.join(",") || null,
        manufacturer: parsed.product.manufacturer,
        officialUrl: parsed.product.officialUrl,
        licensing: parsed.product.licensing,
        requirements: parsed.requirements.join("; ") || null,
        seoTitle: parsed.seo.title,
        seoDescription: parsed.seo.description,
        seoKeywords: parsed.seo.keywords.join(",") || null,
        faqs: parsed.faqs.length ? JSON.stringify(parsed.faqs) : null,
        qualityScore: Math.round(parsed.confidenceScore),
        sourceDocument: item.fileName,
        lastPdsSyncAt: new Date(),
        level: null,
        duration: null,
        isActive: false,
        stripePriceId: null,
        stripeProductId: null,
      });
    }

    const updatedProduct = await db.getProductBySlugIncludingInactive(preview.targetSlug);
    if (!updatedProduct) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Produto não localizado após a aplicação." });
    const versionNumber = await db.createProductVersion({ productId, pdsImportId: input.id, snapshot: JSON.stringify(updatedProduct), createdByUserId: ctx.user.id });

    await db.updatePdsImport(input.id, { productId, status: "applied", appliedAt: new Date() });
    await db.createPdsAuditLog({ pdsImportId: input.id, action: "apply", actorUserId: ctx.user.id, details: JSON.stringify({ productId, versionNumber, appliedFields: selectedFields }) });
    return { success: true, productId, versionNumber };
  }),
  restoreVersion: adminProcedure.input(z.object({
    versionId: z.number().int().positive(),
    confirmation: z.literal("RESTAURAR VERSÃO"),
  })).mutation(async ({ ctx, input }) => {
    const version = await db.getProductVersionById(input.versionId);
    if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Versão não encontrada." });
    const snapshot = parseJson<Record<string, unknown>>(version.snapshot, "Snapshot da versão");
    const slug = typeof snapshot.slug === "string" ? snapshot.slug : null;
    if (!slug) throw new TRPCError({ code: "BAD_REQUEST", message: "O snapshot não contém slug válido." });
    const current = await db.getProductBySlugIncludingInactive(slug);
    if (!current || current.id !== version.productId) throw new TRPCError({ code: "NOT_FOUND", message: "Produto da versão não encontrado." });

    const backupVersion = await db.createProductVersion({ productId: current.id, pdsImportId: null, snapshot: JSON.stringify(current), createdByUserId: ctx.user.id });
    const allowedFields = [
      "name", "description", "shortDescription", "price", "categoryId", "type", "imageUrl", "features",
      "manufacturer", "officialUrl", "licensing", "requirements", "seoTitle", "seoDescription", "seoKeywords",
      "faqs", "qualityScore", "sourceDocument", "lastPdsSyncAt", "level", "duration", "isActive",
      "stripePriceId", "stripeProductId",
    ];
    const patch = Object.fromEntries(allowedFields.filter((field) => field in snapshot).map((field) => [field, snapshot[field]]));
    if (typeof patch.lastPdsSyncAt === "string") patch.lastPdsSyncAt = new Date(patch.lastPdsSyncAt);
    await db.updateProduct(current.id, patch);
    return { success: true, productId: current.id, restoredFrom: version.versionNumber, backupVersion };
  }),
  versions: adminProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) =>
    db.listProductVersions(input.productId)
  ),
});
