import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  listPricingAdministration: vi.fn(),
  getPricingAdministrationById: vi.fn(),
  createPricingAdministration: vi.fn(),
  updatePricingAdministration: vi.fn(),
  createProductPrice: vi.fn(),
  updateProductPrice: vi.fn(),
}));

vi.mock("./db", () => ({
  listPricingAdministration: mocks.listPricingAdministration,
  getPricingAdministrationById: mocks.getPricingAdministrationById,
  createPricingAdministration: mocks.createPricingAdministration,
  updatePricingAdministration: mocks.updatePricingAdministration,
  createProductPrice: mocks.createProductPrice,
  updateProductPrice: mocks.updateProductPrice,
}));

import { adminAdministrationRouter } from "./routers/administration";

function context(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: 1, openId: "test", email: "test@example.com", name: "Test", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

const form = {
  productId: 30001,
  scenarioName: "Ampler — 1 licença",
  planName: "Ampler anual",
  sourceType: "internal" as const,
  costPeriod: "annual" as const,
  sourceCurrency: "USD",
  listUnitCost: 164,
  negotiatedUnitCost: 164,
  useNegotiatedCost: true,
  quantity: 1,
  periodMonths: 12,
  dealDiscountRate: 0,
  exchangeRate: 5.1052994,
  exchangeSpreadRate: 0,
  manufacturerAbsorbsIrrf: true,
  irrfRate: 15,
  cideRate: 0,
  pisRate: 0,
  cofinsRate: 0,
  issRate: 0,
  iofRate: 0,
  otherTaxRate: 0,
  financialCostRate: 0,
  operationalCostRate: 5,
  contingencyRate: 0,
  minimumMarginRate: 25,
  targetMarginRate: 30,
  manualSalePriceBrl: null,
  publicPlanName: "Ampler — licença anual",
  publicBillingPeriod: "annual" as const,
  publicMinSeats: 1,
  publicMaxSeats: null,
  publicDescription: "Licença anual.",
  sourceLabel: "Tabela Ampler",
  sourceUrl: null,
  notes: "IRRF absorvido.",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listPricingAdministration.mockResolvedValue([]);
  mocks.createPricingAdministration.mockResolvedValue(12);
  mocks.createProductPrice.mockResolvedValue(88);
});

describe("adminAdministrationRouter", () => {
  it("bloqueia usuários sem role admin", async () => {
    const caller = adminAdministrationRouter.createCaller(context("user"));
    await expect(caller.list({ productId: 30001 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("salva rascunho com resultados derivados, sem publicar", async () => {
    const caller = adminAdministrationRouter.createCaller(context("admin"));
    const result = await caller.saveDraft(form);
    expect(result).toMatchObject({ success: true, id: 12 });
    expect(result.result).toMatchObject({ totalCostBrl: 879.13, suggestedPriceBrl: 1255.9 });
    expect(mocks.createPricingAdministration).toHaveBeenCalledWith(expect.objectContaining({
      status: "draft",
      totalCostBrl: "879.13",
      finalSalePriceBrl: "1255.90",
      createdByUserId: 1,
    }));
    expect(mocks.createProductPrice).not.toHaveBeenCalled();
  });

  it("exige confirmação explícita para homologar abaixo do mínimo", async () => {
    mocks.getPricingAdministrationById.mockResolvedValue({ id: 12, status: "in_review", finalSalePriceBrl: "900.00", minimumPriceBrl: "1172.18" });
    const caller = adminAdministrationRouter.createCaller(context("admin"));
    await expect(caller.approve({ id: 12, allowBelowMinimum: false })).rejects.toThrow("abaixo do mínimo");
    await caller.approve({ id: 12, allowBelowMinimum: true });
    expect(mocks.updatePricingAdministration).toHaveBeenCalledWith(12, expect.objectContaining({ status: "approved", approvedByUserId: 1 }));
  });

  it("publica somente preço final e campos comerciais seguros", async () => {
    mocks.getPricingAdministrationById.mockResolvedValue({
      id: 12,
      productId: 30001,
      planName: "Interno",
      publicPlanName: "Ampler anual",
      publicMinSeats: 1,
      publicMaxSeats: null,
      publicBillingPeriod: "annual",
      publicDescription: "Licença anual.",
      status: "approved",
      finalSalePriceBrl: "1255.90",
      approvedByUserId: 1,
      approvedAt: new Date(),
      productPriceId: null,
    });
    const caller = adminAdministrationRouter.createCaller(context("admin"));
    const result = await caller.publish({ id: 12 });
    expect(result).toEqual({ success: true, productPriceId: 88 });
    expect(mocks.createProductPrice).toHaveBeenCalledWith(expect.objectContaining({
      planName: "Ampler anual",
      approvedPriceBrl: "1255.90",
      status: "published",
      isPublic: true,
      taxRate: "0.0000",
      marginRate: "0.0000",
    }));
    const publicPayload = mocks.createProductPrice.mock.calls[0][0];
    expect(publicPayload).not.toHaveProperty("listUnitCost");
    expect(publicPayload).not.toHaveProperty("irrfRate");
    expect(publicPayload).not.toHaveProperty("contributionBrl");
  });

  it("retira o preço do público sem excluir o cenário", async () => {
    mocks.getPricingAdministrationById.mockResolvedValue({ id: 12, status: "published", productPriceId: 88 });
    const caller = adminAdministrationRouter.createCaller(context("admin"));
    await caller.withdraw({ id: 12 });
    expect(mocks.updateProductPrice).toHaveBeenCalledWith(88, { status: "approved", isPublic: false, publishedAt: null });
    expect(mocks.updatePricingAdministration).toHaveBeenCalledWith(12, expect.objectContaining({ status: "withdrawn" }));
  });
});
