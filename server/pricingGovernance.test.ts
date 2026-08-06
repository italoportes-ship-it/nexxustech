import { describe, expect, it } from "vitest";
import { calculateBrazilPricing, canPublishApprovedPrice } from "./pricingGovernance";

describe("calculateBrazilPricing", () => {
  it("calcula custo carregado e preço sugerido sem misturar homologação", () => {
    const result = calculateBrazilPricing({
      sourceAmount: 100,
      currency: "USD",
      exchangeRate: 5,
      taxRate: 10,
      operationalCostRate: 5,
      marginRate: 25,
    });

    expect(result.calculatedCostBrl).toBe(575);
    expect(result.suggestedPriceBrl).toBe(766.67);
  });

  it("usa câmbio 1 para valores em BRL", () => {
    expect(calculateBrazilPricing({
      sourceAmount: 200,
      currency: "BRL",
      taxRate: 0,
      operationalCostRate: 0,
      marginRate: 20,
    })).toEqual({ calculatedCostBrl: 200, suggestedPriceBrl: 250 });
  });

  it("rejeita moeda estrangeira sem câmbio", () => {
    expect(() => calculateBrazilPricing({
      sourceAmount: 100,
      currency: "EUR",
      taxRate: 0,
      operationalCostRate: 0,
      marginRate: 20,
    })).toThrow("taxa de câmbio");
  });
});

describe("canPublishApprovedPrice", () => {
  it("permite publicar somente preço homologado por usuário e com data", () => {
    expect(canPublishApprovedPrice({
      status: "approved",
      approvedPriceBrl: "899.90",
      approvedByUserId: 1,
      approvedAt: new Date(),
    })).toBe(true);
  });

  it("bloqueia rascunhos, valores ausentes ou sem aprovador", () => {
    expect(canPublishApprovedPrice({ status: "draft", approvedPriceBrl: "899.90", approvedByUserId: 1, approvedAt: new Date() })).toBe(false);
    expect(canPublishApprovedPrice({ status: "approved", approvedPriceBrl: null, approvedByUserId: 1, approvedAt: new Date() })).toBe(false);
    expect(canPublishApprovedPrice({ status: "approved", approvedPriceBrl: "899.90", approvedByUserId: null, approvedAt: new Date() })).toBe(false);
  });
});
