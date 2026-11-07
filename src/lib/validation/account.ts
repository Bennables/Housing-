import { z } from "zod";
import { AGENCY_LEVELS } from "@/lib/constants";
import { checkDollars, httpUrl, optionalDollars, requiredText } from "./common";

export const chooseRoleSchema = z.object({
  role: z.enum(["household", "builder"], { error: "Pick household or builder." }),
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
