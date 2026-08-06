import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const parsedPds = {
  product: { name: "Ampler", slug: "ampler", manufacturer: "Ampler", category: "Produtividade", subcategory: "Office", licensing: "Assinatura anual", version: null, sku: null, officialUrl: "https://ampler.io/", shortDescription: "Produtividade Office", longDescription: "Descrição completa" },
  problem: { pain: "Trabalho manual", mainBenefit: "Produtividade" },
  benefits: ["Produtividade"],
  audiences: { companies: ["Empresas"], profiles: ["Analistas"] },
  features: ["Scan & Fix"],
  integrations: ["SharePoint"],
  requirements: ["Windows"],
  faqs: [{ question: "Funciona?", answer: "Sim." }],
  seo: { title: "Ampler", description: "Ampler Office", keywords: ["Ampler"] },
  scorecard: [{ label: "Completude", score: 9 }],
  cases: [],
  videos: [],
  pendingValidation: ["Preço"],
  warnings: [],
  confidenceScore: 91,
};

const product = {
  id: 30001,
  name: "Ampler",
  slug: "ampler",
  description: "Anterior",
  shortDescription: "Anterior",
  price: "0.00",
  categoryId: 3,
  type: "software",
  imageUrl: null,
  features: "Anterior",
  manufacturer: "Ampler",
  officialUrl: "https://ampler.io/",
  licensing: "Anterior",
  requirements: "Windows",
  seoTitle: "Anterior",
  seoDescription: "Anterior",
  seoKeywords: "Ampler",
  faqs: "[]",
  qualityScore: 80,
  sourceDocument: null,
  lastPdsSyncAt: null,
  level: null,
  duration: null,
  isActive: true,
  stripePriceId: null,
  stripeProductId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mocks = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
  storagePut: vi.fn(),
  createPdsImport: vi.fn(),
  getPdsImportByHash: vi.fn(),
  createPdsAuditLog: vi.fn(),
  updatePdsImport: vi.fn(),
  getProductBySlugIncludingInactive: vi.fn(),
  getPdsImportById: vi.fn(),
  getPdsAuditLogs: vi.fn(),
  listPdsImports: vi.fn(),
  listProductVersions: vi.fn(),
  createProductVersion: vi.fn(),
  updateProduct: vi.fn(),
  createProduct: vi.fn(),
  getProductVersionById: vi.fn(),
}));

vi.mock("./_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("./db", () => ({
  createPdsImport: mocks.createPdsImport,
  getPdsImportByHash: mocks.getPdsImportByHash,
  createPdsAuditLog: mocks.createPdsAuditLog,
  updatePdsImport: mocks.updatePdsImport,
  getProductBySlugIncludingInactive: mocks.getProductBySlugIncludingInactive,
  getPdsImportById: mocks.getPdsImportById,
  getPdsAuditLogs: mocks.getPdsAuditLogs,
  listPdsImports: mocks.listPdsImports,
  listProductVersions: mocks.listProductVersions,
  createProductVersion: mocks.createProductVersion,
  updateProduct: mocks.updateProduct,
  createProduct: mocks.createProduct,
  getProductVersionById: mocks.getProductVersionById,
}));

import { adminPdsRouter } from "./routers/pds";

function adminContext(): TrpcContext {
  return {
    user: { id: 1, openId: "admin", email: "admin@example.com", name: "Admin", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(parsedPds) } }] });
  mocks.storagePut.mockResolvedValue({ key: "pds/test.txt", url: "/manus-storage/pds/test.txt" });
  mocks.createPdsImport.mockResolvedValue(7);
  mocks.getPdsImportByHash.mockResolvedValue(undefined);
  mocks.getProductBySlugIncludingInactive.mockResolvedValue(product);
  mocks.getPdsAuditLogs.mockResolvedValue([]);
  mocks.listPdsImports.mockResolvedValue([]);
  mocks.listProductVersions.mockResolvedValue([]);
  mocks.createProductVersion.mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValue(3);
});

describe("adminPdsRouter", () => {
  it("analisa TXT com gpt-5-mini, schema estrito e gera prévia sem aplicar automaticamente", async () => {
    const caller = adminPdsRouter.createCaller(adminContext());
    const result = await caller.uploadAndAnalyze({
      fileName: "Ampler PDS.txt",
      mimeType: "text/plain",
      base64: Buffer.from("Product Decision Sheet do Ampler com conteúdo suficiente para processamento seguro e completo.").toString("base64"),
    });

    expect(result.id).toBe(7);
    expect(result.preview.targetSlug).toBe("ampler");
    expect(mocks.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      model: "gpt-5-mini",
      response_format: expect.objectContaining({ json_schema: expect.objectContaining({ strict: true }) }),
    }));
    expect(mocks.updateProduct).not.toHaveBeenCalled();
    expect(mocks.updatePdsImport).toHaveBeenCalledWith(7, expect.objectContaining({ status: "review", extractedText: expect.any(String), parsedData: expect.any(String), changePreview: expect.any(String) }));
  });

  it("gera prévia estruturada quando a IA está indisponível e mantém aprovação humana", async () => {
    mocks.invokeLLM.mockRejectedValueOnce(new Error("usage exhausted"));
    const caller = adminPdsRouter.createCaller(adminContext());
    const result = await caller.uploadAndAnalyze({
      fileName: "Ampler Fallback.txt",
      mimeType: "text/plain",
      base64: Buffer.from(`
Product Decision Sheet – Ampler
1. Identificação
Campo
Valor
Fabricante
Ampler
Produto
Ampler
Categoria
Productivity Software
2. Problema Resolvido
Campo
Valor
Dor principal
Trabalho manual.
Benefício principal
Produtividade.
5. Funcionalidades
Campo
Valor
Scan & Fix
Consistência
9. Requisitos
Campo
Valor
SO
Windows
`).toString("base64"),
    });

    expect(result.analysisMode).toBe("structured-fallback");
    expect(result.preview.targetSlug).toBe("ampler");
    expect(mocks.updatePdsImport).toHaveBeenCalledWith(7, expect.objectContaining({ status: "review", modelId: "structured-fallback" }));
    expect(mocks.updateProduct).not.toHaveBeenCalled();
  });

  it("exige aprovação explícita, cria baseline e nova versão antes de concluir", async () => {
    const preview = { targetProductId: 30001, targetSlug: "ampler", changes: [{ field: "description", label: "Descrição", currentValue: "Anterior", proposedValue: "Descrição completa", kind: "changed", willApply: true }], unchangedFields: [], pendingValidation: [], warnings: [], confidenceScore: 91 };
    mocks.getPdsImportById.mockResolvedValue({ id: 7, productId: 30001, fileName: "Ampler.txt", status: "review", parsedData: JSON.stringify(parsedPds), changePreview: JSON.stringify(preview) });

    const caller = adminPdsRouter.createCaller(adminContext());
    const result = await caller.approveAndApply({ id: 7, confirmation: "APROVAR E APLICAR", fields: ["description"] });

    expect(result).toMatchObject({ success: true, productId: 30001, versionNumber: 2 });
    expect(mocks.createProductVersion).toHaveBeenCalledTimes(2);
    expect(mocks.updateProduct).toHaveBeenCalledWith(30001, expect.objectContaining({ description: "Descrição completa", sourceDocument: "Ampler.txt" }));
    expect(mocks.updatePdsImport).toHaveBeenLastCalledWith(7, expect.objectContaining({ status: "applied", productId: 30001 }));
  });

  it("faz backup do estado atual antes de restaurar uma versão", async () => {
    mocks.getProductVersionById.mockResolvedValue({ id: 4, productId: 30001, versionNumber: 1, snapshot: JSON.stringify(product) });
    mocks.getProductBySlugIncludingInactive.mockResolvedValue({ ...product, description: "Estado atual" });

    const caller = adminPdsRouter.createCaller(adminContext());
    const result = await caller.restoreVersion({ versionId: 4, confirmation: "RESTAURAR VERSÃO" });

    expect(result).toMatchObject({ success: true, productId: 30001, restoredFrom: 1, backupVersion: 1 });
    expect(mocks.createProductVersion).toHaveBeenCalledWith(expect.objectContaining({ productId: 30001, snapshot: expect.stringContaining("Estado atual") }));
    expect(mocks.updateProduct).toHaveBeenCalledWith(30001, expect.objectContaining({ description: "Anterior" }));
  });
});
