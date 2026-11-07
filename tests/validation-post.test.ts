import { describe, expect, it } from "vitest";
import { postInputSchema } from "@/lib/validation/post";

const LISTING = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const parse = (input: Record<string, unknown>) => postInputSchema.safeParse(input);
const message = (input: Record<string, unknown>) => {
  const r = parse(input);
  return r.success ? null : r.error.issues.map((i) => i.message).join(" | ");
};

describe("post input", () => {
  it("accepts a post that shares a listing", () => {
    const r = parse({ body: "Applications open Monday.", listingId: LISTING });
    expect(r.success && r.data).toMatchObject({
      listingId: LISTING,
      sourceUrl: null,
      benefitCents: null,
      benefitFrequency: null,
      eligibility: null,
      states: [],
    });
  });

  it("accepts an unlisted opportunity with amount, frequency, eligibility and states", () => {
    const r = parse({
      body: "New county grant for ADUs.",
      sourceUrl: "https://example.gov/adu",
      benefitDollars: "$1,250.50",
      benefitFrequency: "monthly",
      eligibility: "Homeowners in the county.",
      states: ["CA", "NV"],
    });
    expect(r.success && r.data).toMatchObject({
      listingId: null,
      benefitCents: 125050,
      benefitFrequency: "monthly",
      eligibility: "Homeowners in the county.",
      states: ["CA", "NV"],
    });
  });

  it("requires 1 to 3000 characters of body, ignoring surrounding whitespace", () => {
    expect(message({ body: "   ", listingId: LISTING })).toMatch(/required/);
    expect(parse({ body: "x".repeat(3000), listingId: LISTING }).success).toBe(true);
    expect(message({ body: "x".repeat(3001), listingId: LISTING })).toMatch(/under 3001/);
  });

  it("requires a listing or a source link", () => {
    expect(message({ body: "Heard about a grant" })).toMatch(/Attach a listing or add a link/);
  });

  it("only accepts web addresses as the source", () => {
    expect(message({ body: "x", sourceUrl: "javascript:alert(1)" })).toMatch(/full web address/);
    expect(message({ body: "x", sourceUrl: "ftp://example.gov" })).toMatch(/full web address/);
    expect(message({ body: "x", sourceUrl: "example.gov" })).toMatch(/full web address/);
  });

  it("sets the amount and the frequency together", () => {
    const base = { body: "x", sourceUrl: "https://example.gov" };
    expect(message({ ...base, benefitDollars: "250" })).toMatch(/how often/);
    expect(message({ ...base, benefitFrequency: "monthly" })).toMatch(/Add the amount/);
  });

  it("rejects bad amounts", () => {
    const base = { body: "x", sourceUrl: "https://example.gov", benefitFrequency: "monthly" };
    for (const benefitDollars of ["0", "-5", "abc", "1.234"]) {
      expect(message({ ...base, benefitDollars }), benefitDollars).toMatch(/positive dollar amount/);
    }
  });

  it("keeps amounts and eligibility off posts that share a listing", () => {
    expect(
      message({ body: "x", listingId: LISTING, benefitDollars: "5", benefitFrequency: "monthly" }),
    ).toMatch(/already has its own amount/);
    expect(message({ body: "x", listingId: LISTING, eligibility: "Anyone" })).toMatch(/already has/);
  });

  it("limits eligibility to 2000 characters", () => {
    const base = { body: "x", sourceUrl: "https://example.gov" };
    expect(parse({ ...base, eligibility: "y".repeat(2000) }).success).toBe(true);
    expect(message({ ...base, eligibility: "y".repeat(2001) })).toMatch(/under 2001/);
  });

  it("only accepts real state codes, once each", () => {
    const base = { body: "x", sourceUrl: "https://example.gov" };
    expect(parse({ ...base, states: ["CA", "DC"] }).success).toBe(true);
    expect(message({ ...base, states: ["ZZ"] })).toMatch(/Pick states from the list/);
    expect(message({ ...base, states: ["ca"] })).toMatch(/Pick states from the list/);
    expect(message({ ...base, states: ["CA", "CA"] })).toMatch(/only be added once/);
  });

  it("treats blank optional fields as not provided", () => {
    const r = parse({
      body: "x",
      listingId: LISTING,
      sourceUrl: "",
      benefitDollars: "",
      benefitFrequency: "",
      eligibility: "  ",
    });
    expect(r.success).toBe(true);
  });
});
