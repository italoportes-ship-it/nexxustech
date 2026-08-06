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

export function canPublishApprovedPrice(input: {
  status: string;
  approvedPriceBrl: string | number | null | undefined;
  approvedByUserId: number | null | undefined;
  approvedAt: Date | null | undefined;
}) {
  const price = Number(input.approvedPriceBrl);
  return input.status === "approved" && Number.isFinite(price) && price > 0 && Boolean(input.approvedByUserId && input.approvedAt);
}
