import { z } from "zod";
import { AGENCY_LEVELS } from "@/lib/constants";
import { normalizePhone } from "@/lib/phone";
import { checkDollars, emptyToUndefined, httpUrl, optionalDollars, requiredText } from "./common";

/**
 * Text alerts. A phone number is only kept while the person has opted in, so turning texts off
 * also clears the number.
 */
export const smsSettingsSchema = z
  .object({
    smsOptIn: z.boolean().default(false),
    phone: z.preprocess(emptyToUndefined, z.string().trim().max(32).optional()),
  })
  .transform((value, ctx) => {
    if (!value.smsOptIn) return { smsOptIn: false, phone: null };
    const phone = value.phone ? normalizePhone(value.phone) : null;
    if (!phone) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: value.phone
          ? "Enter a phone number like (555) 123-4567."
          : "Enter your phone number to get texts.",
      });
      return z.NEVER;
    }
    return { smsOptIn: true, phone };
  });

export type SmsSettings = z.output<typeof smsSettingsSchema>;

export const chooseRoleSchema = z.object({
  role: z.enum(["household", "builder"], { error: "Pick household or builder." }),
  // Optional at onboarding. Switching roles later leaves text settings alone.
  sms: smsSettingsSchema.optional(),
});

export const agencyInputSchema = z.object({
  name: requiredText(3, 160, "The agency name"),
  level: z.enum(AGENCY_LEVELS, { error: "Pick what kind of agency this is." }),
  website: httpUrl("The official website"),
});

export const capitalStackSchema = z
  .object({
    projectName: requiredText(1, 120, "The project name"),
    totalCostDollars: z.string().trim().min(1, "Enter the total project cost."),
    firstMortgageDollars: optionalDollars,
  })
  .superRefine((value, ctx) => {
    checkDollars(value.totalCostDollars, ctx, "totalCostDollars", "The total cost");
    checkDollars(value.firstMortgageDollars, ctx, "firstMortgageDollars", "The first mortgage");
  });
