import { z } from "zod";
import { parsePercentToBps } from "@/lib/affordability";
import {
  AGENCY_LEVELS,
  AMI_PERCENTS,
  FREQUENCIES,
  LISTING_TYPES,
  PROJECT_TYPES,
} from "@/lib/constants";
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

const optionalString = z.preprocess(emptyToUndefined, z.string().trim().max(32).optional());

/**
 * The builder's project. Rental projects subtract a first mortgage. Ownership projects run the
 * affordability step instead, so every affordability field is required for them.
 * Output is ready to store: integer cents and basis points.
 */
export const capitalStackSchema = z
  .object({
    projectName: requiredText(1, 120, "The project name"),
    projectType: z
      .enum(PROJECT_TYPES, { error: "Pick rental or homes for sale." })
      .default("rental"),
    totalCostDollars: z.string().trim().min(1, "Enter the total project cost."),
    firstMortgageDollars: optionalDollars,
    unitCount: optionalString,
    areaMedianIncomeDollars: optionalDollars,
    amiPercent: optionalString,
    housingCostPercent: optionalString,
    interestRatePercent: optionalString,
    downPaymentPercent: optionalString,
    otherMonthlyDollars: optionalDollars,
  })
  .transform((v, ctx) => {
    const totalCostCents = checkDollars(
      v.totalCostDollars,
      ctx,
      "totalCostDollars",
      "The total cost",
    );
    const base = { projectName: v.projectName, projectType: v.projectType, totalCostCents };

    if (v.projectType === "rental") {
      const firstMortgageCents = checkDollars(
        v.firstMortgageDollars,
        ctx,
        "firstMortgageDollars",
        "The first mortgage",
      );
      if (totalCostCents === null) return z.NEVER;
      return {
        ...base,
        totalCostCents,
        firstMortgageCents,
        unitCount: null,
        areaMedianIncomeCents: null,
        amiPercent: null,
        housingCostPercent: null,
        interestRateBps: null,
        downPaymentBps: null,
        otherMonthlyCostsCents: null,
      };
    }

    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    const unitCount = Number(v.unitCount);
    if (!v.unitCount || !/^\d+$/.test(v.unitCount) || unitCount < 1 || unitCount > 10_000) {
      issue("unitCount", "Enter how many homes the project will sell, from 1 to 10,000.");
    }
    if (!v.areaMedianIncomeDollars)
      issue("areaMedianIncomeDollars", "Enter the area median income.");
    const areaMedianIncomeCents = checkDollars(
      v.areaMedianIncomeDollars,
      ctx,
      "areaMedianIncomeDollars",
      "The area median income",
    );
    const amiPercent = Number(v.amiPercent);
    if (!(AMI_PERCENTS as readonly number[]).includes(amiPercent)) {
      issue("amiPercent", "Pick the income band the homes are for.");
    }
    const housingCostPercent = Number(v.housingCostPercent);
    if (
      !Number.isInteger(housingCostPercent) ||
      housingCostPercent < 30 ||
      housingCostPercent > 35
    ) {
      issue("housingCostPercent", "Housing cost share must be a whole number from 30 to 35.");
    }
    const interestRateBps = parsePercentToBps(v.interestRatePercent);
    if (interestRateBps === null || interestRateBps === "invalid" || interestRateBps > 2000) {
      issue(
        "interestRatePercent",
        "Enter the mortgage interest rate, like 6.5. It must be 20 or less.",
      );
    }
    const downPaymentBps = parsePercentToBps(v.downPaymentPercent);
    if (downPaymentBps === null || downPaymentBps === "invalid" || downPaymentBps > 5000) {
      issue(
        "downPaymentPercent",
        "Enter the buyer's down payment percent, like 3. It must be 50 or less.",
      );
    }
    const otherMonthlyCostsCents = checkDollars(
      v.otherMonthlyDollars,
      ctx,
      "otherMonthlyDollars",
      "Monthly taxes, insurance and HOA",
    );

    // Any issue added above already fails the parse. This check is only for types.
    if (
      totalCostCents === null ||
      areaMedianIncomeCents === null ||
      typeof interestRateBps !== "number" ||
      typeof downPaymentBps !== "number"
    ) {
      return z.NEVER;
    }
    return {
      ...base,
      totalCostCents,
      firstMortgageCents: null,
      unitCount,
      areaMedianIncomeCents,
      amiPercent,
      housingCostPercent,
      interestRateBps,
      downPaymentBps,
      otherMonthlyCostsCents: otherMonthlyCostsCents ?? 0,
    };
  });

export type CapitalStackInput = z.output<typeof capitalStackSchema>;

/** A funding source the builder adds by hand, such as an employer match or a donor pledge. */
export const stackSourceSchema = z
  .object({
    sourceType: z.enum(LISTING_TYPES, { error: "Pick what kind of funding this is." }),
    name: requiredText(1, 120, "The source name"),
    amountDollars: optionalDollars,
    frequency: z.preprocess(emptyToUndefined, z.enum(FREQUENCIES).optional()),
  })
  .transform((v, ctx) => {
    const amountCents = checkDollars(v.amountDollars, ctx, "amountDollars", "The amount");
    const frequency = v.frequency ?? null;
    if ((amountCents === null) !== (frequency === null)) {
      ctx.addIssue({
        code: "custom",
        path: [amountCents === null ? "amountDollars" : "frequency"],
        message: "An amount needs a frequency, and a frequency needs an amount.",
      });
      return z.NEVER;
    }
    return { sourceType: v.sourceType, name: v.name, amountCents, frequency };
  });
