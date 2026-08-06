export type PricingCalculationInput = {
  sourceAmount: number;
  currency: string;
  exchangeRate?: number | null;
  taxRate: number;
  operationalCostRate: number;
  marginRate: number;
};

export type PricingCalculationResult = {
  calculatedCostBrl: number;
  suggestedPriceBrl: number;
};

export type AdministrationPricingInput = {
  costPeriod: "monthly" | "annual" | "custom";
  sourceCurrency: string;
  listUnitCost: number;
  negotiatedUnitCost?: number | null;
  useNegotiatedCost: boolean;
  quantity: number;
  periodMonths: number;
  dealDiscountRate: number;
  exchangeRate: number;
  exchangeSpreadRate: number;
  manufacturerAbsorbsIrrf: boolean;
  irrfRate: number;
  cideRate: number;
  pisRate: number;
  cofinsRate: number;
  issRate: number;
  iofRate: number;
  otherTaxRate: number;
  financialCostRate: number;
  operationalCostRate: number;
  contingencyRate: number;
  minimumMarginRate: number;
  targetMarginRate: number;
  manualSalePriceBrl?: number | null;
};

export type AdministrationPricingResult = {
  selectedUnitCost: number;
  periodMultiplier: number;
  effectiveExchangeRate: number;
  effectiveIrrfRate: number;
  totalTaxRate: number;
  totalInternalCostRate: number;
  grossForeignCost: number;
  netForeignCost: number;
  baseCostBrl: number;
  taxesBrl: number;
  internalCostsBrl: number;
  totalCostBrl: number;
  minimumPriceBrl: number;
  suggestedPriceBrl: number;
  finalSalePriceBrl: number;
  unitSalePriceBrl: number;
  contributionBrl: number;
  contributionRate: number;
  markupRate: number;
  warnings: string[];
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertPercentage(label: string, value: number, maximum = 100) {
  if (!Number.isFinite(value) || value < 0 || value >= maximum) {
    throw new Error(`${label} deve estar entre 0 e ${maximum - 0.01}.`);
  }
}

export function calculateBrazilPricing(input: PricingCalculationInput): PricingCalculationResult {
  if (!Number.isFinite(input.sourceAmount) || input.sourceAmount <= 0) {
    throw new Error("O valor de origem deve ser maior que zero.");
  }

  const normalizedCurrency = input.currency.trim().toUpperCase();
  const exchangeRate = normalizedCurrency === "BRL" ? 1 : input.exchangeRate;
  if (!exchangeRate || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new Error("Informe uma taxa de câmbio válida para moedas estrangeiras.");
  }

  assertPercentage("Impostos", input.taxRate, 100);
  assertPercentage("Custo operacional", input.operationalCostRate, 100);
  assertPercentage("Margem", input.marginRate, 99.99);

  const baseCostBrl = input.sourceAmount * exchangeRate;
  const loadedCostBrl = baseCostBrl * (1 + (input.taxRate + input.operationalCostRate) / 100);
  const suggestedPriceBrl = loadedCostBrl / (1 - input.marginRate / 100);

  return {
    calculatedCostBrl: roundMoney(loadedCostBrl),
    suggestedPriceBrl: roundMoney(suggestedPriceBrl),
  };
}

export function calculateAdministrationPricing(input: AdministrationPricingInput): AdministrationPricingResult {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) throw new Error("A quantidade deve ser um inteiro maior que zero.");
  if (!Number.isInteger(input.periodMonths) || input.periodMonths <= 0 || input.periodMonths > 120) throw new Error("O período deve estar entre 1 e 120 meses.");
  if (!Number.isFinite(input.listUnitCost) || input.listUnitCost <= 0) throw new Error("O custo unitário de lista deve ser maior que zero.");

  const negotiatedCost = input.negotiatedUnitCost ?? 0;
  if (input.useNegotiatedCost && (!Number.isFinite(negotiatedCost) || negotiatedCost <= 0)) {
    throw new Error("Informe um custo negociado válido ou desative seu uso.");
  }

  const normalizedCurrency = input.sourceCurrency.trim().toUpperCase();
  if (normalizedCurrency !== "BRL" && (!Number.isFinite(input.exchangeRate) || input.exchangeRate <= 0)) {
    throw new Error("Informe uma taxa de câmbio válida para moedas estrangeiras.");
  }

  const percentageEntries: Array<[string, number, number?]> = [
    ["Desconto comercial", input.dealDiscountRate],
    ["Spread cambial", input.exchangeSpreadRate],
    ["IRRF", input.irrfRate],
    ["CIDE", input.cideRate],
    ["PIS", input.pisRate],
    ["COFINS", input.cofinsRate],
    ["ISS", input.issRate],
    ["IOF", input.iofRate],
    ["Outros impostos", input.otherTaxRate],
    ["Custo financeiro", input.financialCostRate],
    ["Custo operacional", input.operationalCostRate],
    ["Contingência", input.contingencyRate],
    ["Margem mínima", input.minimumMarginRate, 99.99],
    ["Margem sugerida", input.targetMarginRate, 99.99],
  ];
  percentageEntries.forEach(([label, value, maximum]) => assertPercentage(label, value, maximum));
  if (input.targetMarginRate < input.minimumMarginRate) throw new Error("A margem sugerida não pode ser menor que a margem mínima.");

  const selectedUnitCost = input.useNegotiatedCost ? negotiatedCost : input.listUnitCost;
  const periodMultiplier = input.costPeriod === "monthly" ? input.periodMonths : 1;
  const grossForeignCost = selectedUnitCost * periodMultiplier * input.quantity;
  const netForeignCost = grossForeignCost * (1 - input.dealDiscountRate / 100);
  const effectiveExchangeRate = normalizedCurrency === "BRL" ? 1 : input.exchangeRate * (1 + input.exchangeSpreadRate / 100);
  const baseCostBrl = netForeignCost * effectiveExchangeRate;
  const effectiveIrrfRate = input.manufacturerAbsorbsIrrf ? 0 : input.irrfRate;
  const totalTaxRate = effectiveIrrfRate + input.cideRate + input.pisRate + input.cofinsRate + input.issRate + input.iofRate + input.otherTaxRate;
  const taxesBrl = baseCostBrl * totalTaxRate / 100;
  const importedCostBrl = baseCostBrl + taxesBrl;
  const totalInternalCostRate = input.financialCostRate + input.operationalCostRate + input.contingencyRate;
  const internalCostsBrl = importedCostBrl * totalInternalCostRate / 100;
  const totalCostBrl = importedCostBrl + internalCostsBrl;
  const minimumPriceBrl = totalCostBrl / (1 - input.minimumMarginRate / 100);
  const suggestedPriceBrl = totalCostBrl / (1 - input.targetMarginRate / 100);
  const manualPrice = input.manualSalePriceBrl ?? 0;
  const finalSalePriceBrl = Number.isFinite(manualPrice) && manualPrice > 0 ? manualPrice : suggestedPriceBrl;
  const unitSalePriceBrl = finalSalePriceBrl / input.quantity;
  const contributionBrl = finalSalePriceBrl - totalCostBrl;
  const contributionRate = finalSalePriceBrl > 0 ? contributionBrl / finalSalePriceBrl * 100 : 0;
  const markupRate = totalCostBrl > 0 ? contributionBrl / totalCostBrl * 100 : 0;
  const warnings: string[] = [];
  if (manualPrice > 0 && manualPrice < minimumPriceBrl) warnings.push("O preço manual está abaixo do preço mínimo calculado.");
  if (contributionBrl < 0) warnings.push("O preço final gera margem de contribuição negativa.");
  if (input.manufacturerAbsorbsIrrf && input.irrfRate > 0) warnings.push("IRRF informado, mas zerado porque o fabricante absorve a retenção.");

  return {
    selectedUnitCost: roundMoney(selectedUnitCost),
    periodMultiplier,
    effectiveExchangeRate: Math.round(effectiveExchangeRate * 1_000_000) / 1_000_000,
    effectiveIrrfRate,
    totalTaxRate: Math.round(totalTaxRate * 10_000) / 10_000,
    totalInternalCostRate: Math.round(totalInternalCostRate * 10_000) / 10_000,
    grossForeignCost: roundMoney(grossForeignCost),
    netForeignCost: roundMoney(netForeignCost),
    baseCostBrl: roundMoney(baseCostBrl),
    taxesBrl: roundMoney(taxesBrl),
    internalCostsBrl: roundMoney(internalCostsBrl),
    totalCostBrl: roundMoney(totalCostBrl),
    minimumPriceBrl: roundMoney(minimumPriceBrl),
    suggestedPriceBrl: roundMoney(suggestedPriceBrl),
    finalSalePriceBrl: roundMoney(finalSalePriceBrl),
    unitSalePriceBrl: roundMoney(unitSalePriceBrl),
    contributionBrl: roundMoney(contributionBrl),
    contributionRate: Math.round(contributionRate * 10_000) / 10_000,
    markupRate: Math.round(markupRate * 10_000) / 10_000,
    warnings,
  };
}

export function canPublishApprovedPrice(input: {
  status: string;
  approvedPriceBrl: string | number | null | undefined;
  approvedByUserId: number | null | undefined;
  approvedAt: Date | null | undefined;
}) {
  const price = Number(input.approvedPriceBrl);
  return input.status === "approved" && Number.isFinite(price) && price > 0 && Boolean(input.approvedByUserId && input.approvedAt);
}
