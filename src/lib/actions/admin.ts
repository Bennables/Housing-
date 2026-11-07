"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { agencies, reports, users } from "@/db/schema";
import { guardAdmin } from "@/lib/guards";
import { fail, ok, type ActionResult } from "./result";

const idSchema = z.uuid();

export async function verifyAgency(agencyId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (!guard.ok) return fail(guard.error);
  if (!idSchema.safeParse(agencyId).success) return fail("That agency no longer exists.");

  const [agency] = await db
    .update(agencies)
    .set({ verified: true })
    .where(eq(agencies.id, agencyId))
    .returning({ id: agencies.id });
  if (!agency) return fail("That agency no longer exists.");

  revalidatePath("/", "layout");
  return ok();
}

/** Reject removes the pending agency and returns the person to the role picker. */
export async function rejectAgency(agencyId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (!guard.ok) return fail(guard.error);
  if (!idSchema.safeParse(agencyId).success) return fail("That agency no longer exists.");

  const [agency] = await db
    .select({ userId: agencies.userId })
    .from(agencies)
    .where(and(eq(agencies.id, agencyId), eq(agencies.verified, false)))
    .limit(1);
  if (!agency) return fail("Only pending agencies can be rejected.");

  await db.batch([
    db.delete(agencies).where(eq(agencies.id, agencyId)),
    db.update(users).set({ role: "unassigned" }).where(eq(users.id, agency.userId)),
  ]);

  revalidatePath("/", "layout");
  return ok();
}

/** Keep the post and clear its reports. Deleting the post itself goes through deletePost. */
export async function dismissReports(postId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (!guard.ok) return fail(guard.error);
  if (!idSchema.safeParse(postId).success) return fail("That post no longer exists.");

  await db.delete(reports).where(eq(reports.postId, postId));
  revalidatePath("/admin");
  return ok();
}
