import { describe, expect, it } from "vitest";
import { capitalStackSchema, stackSourceSchema } from "@/lib/validation/account";

const OWNERSHIP = {
  projectName: "Elm Street Homes",
  projectType: "ownership",
  totalCostDollars: "5,000,000",
  unitCount: "12",
  areaMedianIncomeDollars: "100,000",
  amiPercent: "80",
  housingCostPercent: "30",
  interestRatePercent: "6.5",
  downPaymentPercent: "3",
  otherMonthlyDollars: "",
};
const errors = (input: Record<string, unknown>) => {
  const r = capitalStackSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
};

describe("capitalStackSchema", () => {
  it("keeps the old rental shape working", () => {
    const r = capitalStackSchema.safeParse({
      projectName: "Rental",
      totalCostDollars: "2,500,000",
      firstMortgageDollars: "1,000,000",
    });
    expect(r.success && r.data).toMatchObject({
      projectType: "rental",
      totalCostCents: 2_500_000_00,
      firstMortgageCents: 1_000_000_00,
      unitCount: null,
      amiPercent: null,
    });
  });

  it("stores an ownership project in cents and basis points", () => {
    const r = capitalStackSchema.safeParse(OWNERSHIP);
    expect(r.success && r.data).toMatchObject({
      projectType: "ownership",
      firstMortgageCents: null,
      unitCount: 12,
      areaMedianIncomeCents: 100_000_00,
      amiPercent: 80,
      housingCostPercent: 30,
      interestRateBps: 650,
      downPaymentBps: 300,
      otherMonthlyCostsCents: 0,
    });
  });

  it("requires every affordability field for ownership", () => {
    expect(errors({ ...OWNERSHIP, unitCount: "" })).toContain("unitCount");
    expect(errors({ ...OWNERSHIP, areaMedianIncomeDollars: "" })).toContain(
      "areaMedianIncomeDollars",
    );
    expect(errors({ ...OWNERSHIP, interestRatePercent: "" })).toContain("interestRatePercent");
    expect(errors({ ...OWNERSHIP, downPaymentPercent: "" })).toContain("downPaymentPercent");
  });

  it("rejects values outside the allowed ranges", () => {
    expect(errors({ ...OWNERSHIP, amiPercent: "75" })).toContain("amiPercent");
    expect(errors({ ...OWNERSHIP, housingCostPercent: "40" })).toContain("housingCostPercent");
    expect(errors({ ...OWNERSHIP, interestRatePercent: "25" })).toContain("interestRatePercent");
    expect(errors({ ...OWNERSHIP, downPaymentPercent: "60" })).toContain("downPaymentPercent");
    expect(errors({ ...OWNERSHIP, unitCount: "1.5" })).toContain("unitCount");
    expect(errors({ ...OWNERSHIP, otherMonthlyDollars: "-5" })).toContain("otherMonthlyDollars");
  });
});

describe("stackSourceSchema", () => {
  it("accepts a donor pledge with an amount and frequency", () => {
    const r = stackSourceSchema.safeParse({
      sourceType: "donor",
      name: "Family foundation pledge",
      amountDollars: "250,000",
      frequency: "one_time",
    });
    expect(r.success && r.data).toEqual({
      sourceType: "donor",
      name: "Family foundation pledge",
      amountCents: 250_000_00,
      frequency: "one_time",
    });
  });

  it("accepts a source with no amount yet", () => {
    const r = stackSourceSchema.safeParse({ sourceType: "employer", name: "Hospital match" });
    expect(r.success && r.data).toMatchObject({ amountCents: null, frequency: null });
  });

  it("needs amount and frequency together", () => {
    expect(
      stackSourceSchema.safeParse({ sourceType: "lender", name: "Bank", amountDollars: "100" })
        .success,
    ).toBe(false);
    expect(
      stackSourceSchema.safeParse({ sourceType: "lender", name: "Bank", frequency: "monthly" })
        .success,
    ).toBe(false);
  });

  it("rejects unknown source types", () => {
    expect(stackSourceSchema.safeParse({ sourceType: "crypto", name: "x" }).success).toBe(false);
  });
});
