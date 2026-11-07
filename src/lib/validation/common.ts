import { z } from "zod";
import { isStateCode } from "@/lib/states";
import { parseDollarsToCents } from "@/lib/money";

export const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const optionalText = (max: number, label: string) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(max, `${label} must be under ${max + 1} characters.`)
      .optional(),
  );

export const requiredText = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required.`)
    .max(max, `${label} must be under ${max + 1} characters.`);

export const httpUrl = (label: string) =>
  z
    .url({
      protocol: /^https?$/,
      error: `${label} must be a full web address that starts with https://`,
    })
    .max(2048, `${label} is too long.`);

export const optionalHttpUrl = (label: string) =>
  z.preprocess(emptyToUndefined, httpUrl(label).optional());

export const optionalDollars = z.preprocess(emptyToUndefined, z.string().trim().optional());

export function checkDollars(
  value: string | undefined,
  ctx: z.RefinementCtx,
  path: string,
  label: string,
): number | null {
  const cents = parseDollarsToCents(value);
  if (cents === "invalid") {
    ctx.addIssue({
      code: "custom",
      path: [path],
      message: `${label} must be a positive dollar amount, like 250 or 1,250.50.`,
    });
    return null;
  }
  return cents;
}

export function checkStates(states: string[], ctx: z.RefinementCtx, path = "states") {
  if (states.some((s) => !isStateCode(s))) {
    ctx.addIssue({ code: "custom", path: [path], message: "Pick states from the list." });
  }
  if (new Set(states).size !== states.length) {
    ctx.addIssue({ code: "custom", path: [path], message: "Each state can only be added once." });
  }
}

/** The first problem as a plain sentence, for showing in a form. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
