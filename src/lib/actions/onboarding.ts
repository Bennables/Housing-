"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { agencies, users } from "@/db/schema";
import { getAgencyForUser } from "@/lib/data/agency";
import { guardSignedIn } from "@/lib/guards";
import { agencyInputSchema, chooseRoleSchema, smsSettingsSchema } from "@/lib/validation/account";
import { firstError } from "@/lib/validation/common";
import { fail, ok, type ActionResult } from "./result";

/** Pick Household or Builder. Also used to switch between the two from the profile page. */
export async function chooseRole(
  raw: unknown,
): Promise<ActionResult<{ role: "household" | "builder" }>> {
  const guard = await guardSignedIn();
  if (!guard.ok) return fail(guard.error);

  const parsed = chooseRoleSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));

  if (guard.viewer.role === "agency") {
    return fail("Agency accounts cannot switch to household or builder.");
  }

  const { role, sms } = parsed.data;
  await db
    .update(users)
    .set(sms ? { role, smsOptIn: sms.smsOptIn, phone: sms.phone } : { role })
    .where(eq(users.id, guard.viewer.id));
  revalidatePath("/", "layout");
  return ok({ role });
}

/** Turn text alerts on or off. Turning them off also deletes the stored phone number. */
export async function updateSmsSettings(raw: unknown): Promise<ActionResult> {
  const guard = await guardSignedIn();
  if (!guard.ok) return fail(guard.error);

  const parsed = smsSettingsSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));

  await db
    .update(users)
    .set({ smsOptIn: parsed.data.smsOptIn, phone: parsed.data.phone })
    .where(eq(users.id, guard.viewer.id));
  revalidatePath("/profile");
  return ok();
}

/** Becoming an agency always goes through verification: the agency starts unverified. */
export async function registerAgency(raw: unknown): Promise<ActionResult> {
  const guard = await guardSignedIn();
  if (!guard.ok) return fail(guard.error);
  if (guard.viewer.role === "agency") return fail("You already represent an agency.");

  const parsed = agencyInputSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));

  if (await getAgencyForUser(guard.viewer.id)) {
    return fail("You already have an agency waiting for review.");
  }

  // HTTP mode has no transactions, so the two writes go in one batch.
  await db.batch([
    db.insert(agencies).values({
      userId: guard.viewer.id,
      name: parsed.data.name,
      level: parsed.data.level,
      website: parsed.data.website,
      verified: false,
    }),
    db.update(users).set({ role: "agency" }).where(eq(users.id, guard.viewer.id)),
  ]);

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return ok();
}
