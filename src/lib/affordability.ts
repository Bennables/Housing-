// "Does it pencil?" for homes sold to income-qualified buyers.
//
// A buyer's price is capped by income: housing costs should stay around 30 to 35 percent of what
// the household earns. The builder enters the area median income (AMI) from the official income
// limits, an AMI band to target, and loan terms. We never collect anyone's actual income.
//
// Steps:
//   household income   = AMI x band %
//   monthly budget     = income x housing cost % / 12
//   mortgage payment   = monthly budget - taxes, insurance and HOA
//   max loan           = present value of that payment over the loan term
//   max price          = max loan / (1 - down payment %)

export const LOAN_TERM_YEARS = 30;

export type AffordabilityInput = {
  /** Yearly area median income for the household size, in cents. */
  areaMedianIncomeCents: number;
  /** Target band, e.g. 80 for 80% of AMI. */
  amiPercent: number;
  /** Share of income that can go to housing, 30 to 35. */
  housingCostPercent: number;
  /** Yearly interest rate in basis points: 650 means 6.50%. */
  interestRateBps: number;
  /** Down payment in basis points of the price: 300 means 3%. */
  downPaymentBps: number;
  /** Monthly property tax, insurance and HOA, in cents. */
  otherMonthlyCostsCents: number;
  termYears?: number;
};

export type Affordability = {
  householdIncomeCents: number;
  monthlyHousingBudgetCents: number;
  monthlyMortgagePaymentCents: number;
  maxLoanCents: number;
  downPaymentCents: number;
  /** The most a household at this band can pay for one home. */
  maxPriceCents: number;
};

export function computeAffordability(input: AffordabilityInput): Affordability {
  const termMonths = (input.termYears ?? LOAN_TERM_YEARS) * 12;
  const householdIncomeCents = Math.floor((input.areaMedianIncomeCents * input.amiPercent) / 100);
  const monthlyHousingBudgetCents = Math.floor(
    (householdIncomeCents * input.housingCostPercent) / 100 / 12,
  );
  const monthlyMortgagePaymentCents = Math.max(
    0,
    monthlyHousingBudgetCents - Math.max(0, input.otherMonthlyCostsCents),
  );

  const monthlyRate = input.interestRateBps / 10_000 / 12;
  const maxLoanCents = Math.floor(
    monthlyRate === 0
      ? monthlyMortgagePaymentCents * termMonths
      : (monthlyMortgagePaymentCents * (1 - (1 + monthlyRate) ** -termMonths)) / monthlyRate,
  );

  const downShare = Math.min(Math.max(input.downPaymentBps, 0), 9_999) / 10_000;
  const maxPriceCents = Math.floor(maxLoanCents / (1 - downShare));

  return {
    householdIncomeCents,
    monthlyHousingBudgetCents,
    monthlyMortgagePaymentCents,
    maxLoanCents,
    downPaymentCents: maxPriceCents - maxLoanCents,
    maxPriceCents,
  };
}

/** Sales revenue when every home sells at the affordable price. */
export function affordableSalesRevenueCents(maxPriceCents: number, unitCount: number): number {
  return maxPriceCents * Math.max(0, Math.floor(unitCount));
}

/** "6.5" -> 650 basis points. Returns null for an empty field and "invalid" for anything else. */
export function parsePercentToBps(input: string | null | undefined): number | null | "invalid" {
  const text = (input ?? "").trim().replace(/%$/, "").trim();
  if (text === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return "invalid";
  return Math.round(Number(text) * 100);
}

export function bpsToPercentString(bps: number | null | undefined): string {
  if (bps == null) return "";
  const pct = bps / 100;
  return Number.isInteger(pct) ? String(pct) : String(Number(pct.toFixed(2)));
}
