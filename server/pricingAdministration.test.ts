import { describe, expect, it } from "vitest";
import { calculateAdministrationPricing, type AdministrationPricingInput } from "./pricingGovernance";

const base: AdministrationPricingInput = {
  costPeriod: "annual",
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
};

describe("calculateAdministrationPricing", () => {
  it("calcula o cenário anual Ampler com IRRF absorvido e margens editáveis", () => {
    const result = calculateAdministrationPricing(base);
    expect(result.effectiveIrrfRate).toBe(0);
    expect(result.baseCostBrl).toBe(837.27);
    expect(result.totalCostBrl).toBe(879.13);
    expect(result.minimumPriceBrl).toBe(1172.18);
    expect(result.suggestedPriceBrl).toBe(1255.9);
    expect(result.unitSalePriceBrl).toBe(1255.9);
    expect(result.contributionRate).toBeCloseTo(30, 4);
    expect(result.warnings).toContain("IRRF informado, mas zerado porque o fabricante absorve a retenção.");
  });

  it("multiplica custo mensal por período e quantidade antes de aplicar desconto", () => {
    const result = calculateAdministrationPricing({
      ...base,
      costPeriod: "monthly",
      listUnitCost: 10,
      negotiatedUnitCost: null,
      useNegotiatedCost: false,
      quantity: 5,
      periodMonths: 12,
      dealDiscountRate: 20,
      exchangeRate: 5,
      manufacturerAbsorbsIrrf: false,
      operationalCostRate: 0,
      targetMarginRate: 25,
    });
    expect(result.grossForeignCost).toBe(600);
    expect(result.netForeignCost).toBe(480);
    expect(result.baseCostBrl).toBe(2400);
    expect(result.taxesBrl).toBe(360);
    expect(result.totalCostBrl).toBe(2760);
    expect(result.suggestedPriceBrl).toBe(3680);
  });

  it("usa o preço manual e alerta quando ele fica abaixo do mínimo", () => {
    const result = calculateAdministrationPricing({ ...base, manualSalePriceBrl: 900 });
    expect(result.finalSalePriceBrl).toBe(900);
    expect(result.warnings).toContain("O preço manual está abaixo do preço mínimo calculado.");
  });

  it("rejeita margem sugerida menor que a margem mínima", () => {
    expect(() => calculateAdministrationPricing({ ...base, minimumMarginRate: 30, targetMarginRate: 25 })).toThrow("margem sugerida");
  });
});
