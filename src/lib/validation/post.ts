import { z } from "zod";
import { FREQUENCIES } from "@/lib/constants";
import {
  checkDollars,
  checkStates,
  emptyToUndefined,
  optionalDollars,
  optionalHttpUrl,
  optionalText,
  requiredText,
} from "./common";

export const POST_BODY_MAX = 3000;
export const ELIGIBILITY_MAX = 2000;

export const postInputSchema = z
  .object({
    body: requiredText(1, POST_BODY_MAX, "Your post"),
    listingId: z.preprocess(emptyToUndefined, z.uuid("Pick a listing from the list.").optional()),
    states: z.array(z.string()).max(51).default([]),
    sourceUrl: optionalHttpUrl("The source link"),
    benefitDollars: optionalDollars,
    benefitFrequency: z.preprocess(emptyToUndefined, z.enum(FREQUENCIES).optional()),
    eligibility: optionalText(ELIGIBILITY_MAX, "Eligibility"),
  })
  .superRefine((value, ctx) => {
    checkStates(value.states, ctx);

    const cents = checkDollars(value.benefitDollars, ctx, "benefitDollars", "The benefit amount");
    if (cents !== null && !value.benefitFrequency) {
      ctx.addIssue({
        code: "custom",
        path: ["benefitFrequency"],
        message: "Say how often the amount is paid.",
      });
    }
    if (cents === null && value.benefitFrequency && !value.benefitDollars) {
      ctx.addIssue({
        code: "custom",
        path: ["benefitDollars"],
        message: "Add the amount, or clear how often it is paid.",
      });
    }

    if (!value.listingId && !value.sourceUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "Attach a listing or add a link to your source.",
      });
    }

    // Amounts and eligibility belong to the listing when one is attached. One source of truth.
    if (value.listingId && (value.benefitDollars || value.eligibility)) {
      ctx.addIssue({
        code: "custom",
        path: ["listingId"],
        message: "A shared listing already has its own amount and eligibility. Remove those fields.",
      });
    }
  })
  .transform((value) => ({
    body: value.body,
    listingId: value.listingId ?? null,
    states: value.states,
    sourceUrl: value.sourceUrl ?? null,
    benefitCents: parseCentsOrNull(value.benefitDollars),
    benefitFrequency: value.benefitDollars ? (value.benefitFrequency ?? null) : null,
    eligibility: value.eligibility ?? null,
  }));

function parseCentsOrNull(dollars: string | undefined): number | null {
  if (!dollars) return null;
  // superRefine has already rejected anything invalid, so this always parses.
  return Math.round(Number(dollars.replace(/^\$/, "").replace(/,/g, "")) * 100);
}

export type PostInput = z.output<typeof postInputSchema>;

export const commentInputSchema = z.object({
  postId: z.uuid(),
  body: requiredText(1, 1000, "Your comment"),
});

export const reportInputSchema = z.object({
  postId: z.uuid(),
  reason: requiredText(1, 300, "A reason"),
});
