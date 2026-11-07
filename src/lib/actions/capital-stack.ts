"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { capitalStacks } from "@/db/schema";
import { guardRole } from "@/lib/guards";
import { parseDollarsToCents } from "@/lib/money";
import { capitalStackSchema } from "@/lib/validation/account";
import { firstError } from "@/lib/validation/common";
import { fail, ok, type ActionResult } from "./result";

export async function saveCapitalStack(raw: unknown): Promise<ActionResult> {
  const guard = await guardRole("builder");
  if (!guard.ok) return fail(guard.error);

  const parsed = capitalStackSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));

  // The schema has already checked both amounts, so these always parse to a number or null.
  const totalCostCents = parseDollarsToCents(parsed.data.totalCostDollars);
  const mortgage = parseDollarsToCents(parsed.data.firstMortgageDollars);
  if (typeof totalCostCents !== "number" || mortgage === "invalid") {
    return fail("Check the amounts and try again.");
  }

  const values = {
    projectName: parsed.data.projectName,
    totalCostCents,
    firstMortgageCents: mortgage,
  };
  await db
    .insert(capitalStacks)
    .values({ userId: guard.viewer.id, ...values })
    .onConflictDoUpdate({ target: capitalStacks.userId, set: values });

  revalidatePath("/", "layout");
  return ok();
}
