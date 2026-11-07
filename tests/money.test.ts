import { describe, expect, it } from "vitest";
import { formatAmount, formatMoney, parseDollarsToCents, potentialCents } from "@/lib/money";

describe("parseDollarsToCents", () => {
  it("parses plain, comma and dollar-sign input", () => {
    expect(parseDollarsToCents("250")).toBe(25000);
    expect(parseDollarsToCents("1,250.50")).toBe(125050);
    expect(parseDollarsToCents("$40000")).toBe(4000000);
    expect(parseDollarsToCents("0.07")).toBe(7);
  });

  it("avoids floating point errors", () => {
    expect(parseDollarsToCents("19.99")).toBe(1999);
    expect(parseDollarsToCents("1.15")).toBe(115);
  });

  it("treats empty input as no amount", () => {
    expect(parseDollarsToCents("")).toBeNull();
    expect(parseDollarsToCents("   ")).toBeNull();
    expect(parseDollarsToCents(undefined)).toBeNull();
  });

  it("rejects zero, negatives, junk and absurd amounts", () => {
    for (const bad of ["0", "-5", "abc", "1.234", "12.3.4", "1e5", "$", "999999999999999"]) {
      expect(parseDollarsToCents(bad), bad).toBe("invalid");
    }
  });
});

describe("formatAmount", () => {
  it("never shows an amount without a frequency", () => {
    expect(formatAmount(null, 29200, null)).toBeNull();
  });

  it("formats single, capped and ranged amounts with their frequency", () => {
    expect(formatAmount(null, 29200, "monthly")).toBe("Up to $292/month");
    expect(formatAmount(4000000, 4000000, "one_time")).toBe("$40,000 one-time");
    expect(formatAmount(10000, 50000, "monthly")).toBe("$100 to $500/month");
    expect(formatAmount(0 + 1, 50000, "yearly")).toBe("$0.01 to $500/year");
    expect(formatAmount(10000, null, "weekly")).toBe("From $100/week");
  });

  it("returns null when there is no amount", () => {
    expect(formatAmount(null, null, "monthly")).toBeNull();
  });
});

describe("formatMoney and potentialCents", () => {
  it("shows whole dollars without cents and keeps real cents", () => {
    expect(formatMoney(25000)).toBe("$250");
    expect(formatMoney(25050)).toBe("$250.50");
  });

  it("uses the highest known amount as the potential amount", () => {
    expect(potentialCents(100, 500)).toBe(500);
    expect(potentialCents(100, null)).toBe(100);
    expect(potentialCents(null, null)).toBeNull();
  });
});
