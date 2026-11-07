import { z } from "zod";
import {
  AUDIENCES,
  FREQUENCIES,
  LISTING_CATEGORIES,
  LISTING_LEVELS,
  LISTING_TYPES,
} from "@/lib/constants";
import { parseDollarsToCents } from "@/lib/money";
import { isStateCode } from "@/lib/states";
import {
  checkDollars,
  emptyToUndefined,
  httpUrl,
  optionalDollars,
  optionalText,
  requiredText,
} from "./common";

const dateField = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a date.`)
      // JavaScript rolls 2026-02-31 over to March, so check that the date round-trips unchanged.
      .refine((v) => {
        const d = new Date(`${v}T00:00:00Z`);
        return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
      }, `${label} must be a real date.`)
      .optional(),
  );

export const listingInputSchema = z
  .object({
    name: requiredText(3, 160, "The name"),
    type: z.enum(LISTING_TYPES, { error: "Pick a type." }),
    category: z.enum(LISTING_CATEGORIES, { error: "Pick a category." }),
    level: z.enum(LISTING_LEVELS, { error: "Pick a level." }),
    summary: requiredText(10, 1000, "The summary"),
    eligibility: optionalText(2000, "Eligibility"),
    url: httpUrl("The official link"),
    state: z.preprocess(emptyToUndefined, z.string().optional()),
    targetAudience: z.enum(AUDIENCES, { error: "Pick who this is for." }),
    amountMinDollars: optionalDollars,
    amountMaxDollars: optionalDollars,
    frequency: z.preprocess(emptyToUndefined, z.enum(FREQUENCIES).optional()),
    opensOn: dateField("The opening date"),
    closesOn: dateField("The closing date"),
    sourceCheckedOn: dateField("The last-verified date"),
  })
  .superRefine((value, ctx) => {
    if (value.level !== "federal") {
      if (!value.state || !isStateCode(value.state)) {
        ctx.addIssue({ code: "custom", path: ["state"], message: "Pick the state." });
      }
    }

    const min = checkDollars(value.amountMinDollars, ctx, "amountMinDollars", "The lowest amount");
    const max = checkDollars(value.amountMaxDollars, ctx, "amountMaxDollars", "The highest amount");
    if (min !== null && max !== null && min > max) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMinDollars"],
        message: "The lowest amount cannot be higher than the highest amount.",
      });
    }
    const hasAmount = min !== null || max !== null;
    if (hasAmount && !value.frequency) {
      ctx.addIssue({
        code: "custom",
        path: ["frequency"],
        message: "Say how often the amount is paid.",
      });
    }
    if ((value.type === "grant" || value.type === "benefit") && !value.frequency) {
      ctx.addIssue({
        code: "custom",
        path: ["frequency"],
        message: "Grants and benefits need a frequency.",
      });
    }
    if (value.opensOn && value.closesOn && value.closesOn < value.opensOn) {
      ctx.addIssue({
        code: "custom",
        path: ["closesOn"],
        message: "The closing date must be on or after the opening date.",
      });
    }
  })
  .transform((value) => ({
    name: value.name,
    type: value.type,
    category: value.category,
    level: value.level,
    summary: value.summary,
    eligibility: value.eligibility ?? null,
    url: value.url,
    state: value.level === "federal" ? null : (value.state ?? null),
    targetAudience: value.targetAudience,
    amountMinCents: toCents(value.amountMinDollars),
    amountMaxCents: toCents(value.amountMaxDollars),
    frequency: value.frequency ?? null,
    opensAt: value.opensOn ? new Date(`${value.opensOn}T00:00:00.000Z`) : null,
    // A closing date means the whole day counts, so the listing closes at the end of that day (UTC).
    closesAt: value.closesOn ? new Date(`${value.closesOn}T23:59:59.000Z`) : null,
    sourceCheckedAt: value.sourceCheckedOn ?? null,
  }));

function toCents(dollars: string | undefined): number | null {
  const cents = parseDollarsToCents(dollars);
  return cents === "invalid" ? null : cents;
}

export type ListingInput = z.output<typeof listingInputSchema>;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
