import { describe, expect, it } from "vitest";
import { listingInputSchema, slugify } from "@/lib/validation/listing";

const valid = {
  name: "Example Rent Help",
  type: "benefit",
  category: "rent",
  level: "state",
  state: "CA",
  summary: "Helps renters cover part of their rent.",
  url: "https://example.gov/rent",
  targetAudience: "household",
  frequency: "monthly",
};
const parse = (patch: Record<string, unknown> = {}) =>
  listingInputSchema.safeParse({ ...valid, ...patch });
const message = (patch: Record<string, unknown>) => {
  const r = parse(patch);
  return r.success ? null : r.error.issues.map((i) => i.message).join(" | ");
};

describe("listing input", () => {
  it("accepts a valid listing and converts dollars and dates", () => {
    const r = parse({
      amountMinDollars: "100",
      amountMaxDollars: "1,500",
      opensOn: "2026-01-01",
      closesOn: "2026-03-31",
      sourceCheckedOn: "2026-02-01",
    });
    expect(r.success && r.data).toMatchObject({
      amountMinCents: 10000,
      amountMaxCents: 150000,
      opensAt: new Date("2026-01-01T00:00:00.000Z"),
      closesAt: new Date("2026-03-31T23:59:59.000Z"),
      sourceCheckedAt: "2026-02-01",
    });
  });

  it("requires a frequency for grants and benefits", () => {
    expect(message({ frequency: "" })).toMatch(/Grants and benefits need a frequency/);
    expect(parse({ type: "loan", frequency: "" }).success).toBe(true);
  });

  it("requires a frequency whenever an amount is set", () => {
    expect(message({ type: "loan", frequency: "", amountMaxDollars: "500" })).toMatch(/how often/);
  });

  it("rejects a lowest amount above the highest", () => {
    expect(message({ amountMinDollars: "500", amountMaxDollars: "100" })).toMatch(
      /cannot be higher/,
    );
  });

  it("requires a state unless the listing is federal, and clears it for federal", () => {
    expect(message({ state: "" })).toMatch(/Pick the state/);
    expect(message({ state: "ZZ" })).toMatch(/Pick the state/);
    const federal = parse({ level: "federal", state: "CA" });
    expect(federal.success && federal.data.state).toBeNull();
  });

  it("rejects a closing date before the opening date", () => {
    expect(message({ opensOn: "2026-05-01", closesOn: "2026-04-01" })).toMatch(/on or after/);
  });

  it("rejects non-web source links", () => {
    expect(message({ url: "javascript:alert(1)" })).toMatch(/full web address/);
  });

  it("rejects impossible dates", () => {
    expect(message({ opensOn: "2026-02-31" })).toMatch(/real date/);
  });

  it("treats no dates as rolling", () => {
    const r = parse();
    expect(r.success && r.data).toMatchObject({ opensAt: null, closesAt: null });
  });
});

describe("slugify", () => {
  it("makes short, URL-safe slugs", () => {
    expect(slugify("OC Housing Finance Trust: ADU Loan")).toBe("oc-housing-finance-trust-adu-loan");
    expect(slugify("EITC & CalEITC")).toBe("eitc-and-caleitc");
    expect(slugify("  Café  Grant!! ")).toBe("cafe-grant");
  });
});
