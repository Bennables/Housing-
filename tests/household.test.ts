import { describe, expect, it } from "vitest";
import { summarizeHousehold, toMonthlyCents } from "@/lib/household";

describe("toMonthlyCents", () => {
  it("converts each frequency to monthly", () => {
    expect(toMonthlyCents(1200, "monthly")).toBe(1200);
    expect(toMonthlyCents(1200, "weekly")).toBe(5200); // 1200 * 52 / 12
    expect(toMonthlyCents(3000, "quarterly")).toBe(1000);
    expect(toMonthlyCents(120000, "yearly")).toBe(10000);
  });

  it("has no monthly value for one-time amounts", () => {
    expect(toMonthlyCents(5000, "one_time")).toBeNull();
  });
});

describe("summarizeHousehold", () => {
  it("totals monthly money and keeps one-time amounts separate", () => {
    const s = summarizeHousehold([
      { amountCents: 29200, frequency: "monthly" },
      { amountCents: 120000, frequency: "yearly" },
      { amountCents: 50000, frequency: "one_time" },
      { amountCents: null, frequency: null },
    ]);
    expect(s).toEqual({ monthlyCents: 39200, oneTimeCents: 50000, unknownCount: 1 });
  });
});
