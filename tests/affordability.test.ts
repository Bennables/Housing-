import { describe, expect, it } from "vitest";
import {
  affordableSalesRevenueCents,
  bpsToPercentString,
  computeAffordability,
  parsePercentToBps,
} from "@/lib/affordability";
import { summarizeStack } from "@/lib/capital-stack";

// $100,000 AMI, 80% band, 30% of income, 6% rate, 3% down, $400/month taxes and insurance.
const BASE = {
  areaMedianIncomeCents: 100_000_00,
  amiPercent: 80,
  housingCostPercent: 30,
  interestRateBps: 600,
  downPaymentBps: 300,
  otherMonthlyCostsCents: 400_00,
};

describe("computeAffordability", () => {
  it("turns an income band into a max home price", () => {
    const a = computeAffordability(BASE);
    expect(a.householdIncomeCents).toBe(80_000_00);
    expect(a.monthlyHousingBudgetCents).toBe(2_000_00);
    expect(a.monthlyMortgagePaymentCents).toBe(1_600_00);
    expect(a.maxLoanCents).toBe(26_686_658); // $266,866.58
    expect(a.maxPriceCents).toBe(27_512_018); // $275,120.18
    expect(a.downPaymentCents).toBe(a.maxPriceCents - a.maxLoanCents);
  });

  it("handles a zero interest rate", () => {
    const a = computeAffordability({ ...BASE, interestRateBps: 0, downPaymentBps: 0 });
    expect(a.maxLoanCents).toBe(1_600_00 * 360);
    expect(a.maxPriceCents).toBe(1_600_00 * 360);
  });

  it("gives zero when other costs use up the whole budget", () => {
    const a = computeAffordability({ ...BASE, otherMonthlyCostsCents: 2_500_00 });
    expect(a.monthlyMortgagePaymentCents).toBe(0);
    expect(a.maxPriceCents).toBe(0);
  });

  it("lets a higher housing share buy more", () => {
    const at30 = computeAffordability(BASE).maxPriceCents;
    const at35 = computeAffordability({ ...BASE, housingCostPercent: 35 }).maxPriceCents;
    expect(at35).toBeGreaterThan(at30);
  });
});

describe("affordable sales and the ownership gap", () => {
  it("is cost minus sales minus subsidies", () => {
    const price = computeAffordability(BASE).maxPriceCents;
    const sales = affordableSalesRevenueCents(price, 10);
    expect(sales).toBe(price * 10);

    const s = summarizeStack({
      totalCostCents: 5_000_000_00,
      salesRevenueCents: sales,
      items: [
        {
          id: "g",
          kind: "listing",
          title: "Grant",
          amountCents: 500_000_00,
          frequency: "one_time",
        },
        {
          id: "d",
          kind: "source",
          sourceType: "donor",
          title: "Donor",
          amountCents: 250_000_00,
          frequency: "one_time",
        },
        {
          id: "r",
          kind: "source",
          sourceType: "earned_revenue",
          title: "Resale",
          amountCents: 40_000_00,
          frequency: "yearly",
        },
      ],
    });
    expect(s.remainingGapCents).toBe(5_000_000_00 - sales - 750_000_00);
    // Recurring earned revenue is listed, not added to the gap.
    expect(s.recurring.map((r) => r.frequency)).toEqual(["yearly"]);
  });

  it("can go negative when sales and subsidies cover the cost", () => {
    const s = summarizeStack({ totalCostCents: 1_000_00, salesRevenueCents: 1_500_00, items: [] });
    expect(s.remainingGapCents).toBe(-500_00);
    expect(s.overfundedCents).toBe(500_00);
  });
});

describe("percent parsing", () => {
  it("reads percents as basis points", () => {
    expect(parsePercentToBps("6.5")).toBe(650);
    expect(parsePercentToBps("3%")).toBe(300);
    expect(parsePercentToBps("")).toBeNull();
    expect(parsePercentToBps("abc")).toBe("invalid");
    expect(parsePercentToBps("-1")).toBe("invalid");
    expect(bpsToPercentString(650)).toBe("6.5");
    expect(bpsToPercentString(300)).toBe("3");
  });
});
