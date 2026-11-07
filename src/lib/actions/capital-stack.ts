"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { capitalStacks, stackSources } from "@/db/schema";
import { guardRole } from "@/lib/guards";
import { capitalStackSchema, stackSourceSchema } from "@/lib/validation/account";
import { firstError } from "@/lib/validation/common";
import { fail, ok, type ActionResult } from "./result";

export async function saveCapitalStack(raw: unknown): Promise<ActionResult> {
  const guard = await guardRole("builder");
  if (!guard.ok) return fail(guard.error);

  const parsed = capitalStackSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));

  const values = parsed.data;
  await db
    .insert(capitalStacks)
    .values({ userId: guard.viewer.id, ...values })
    .onConflictDoUpdate({ target: capitalStacks.userId, set: values });

  revalidatePath("/", "layout");
  return ok();
}

const MAX_SOURCES = 50;

/** Adds a funding source that is not a listing, like a donor pledge or an employer match. */
export async function addStackSource(raw: unknown): Promise<ActionResult> {
  const guard = await guardRole("builder");
  if (!guard.ok) return fail(guard.error);

  const parsed = stackSourceSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));

  const existing = await db
    .select({ id: stackSources.id })
    .from(stackSources)
    .where(eq(stackSources.userId, guard.viewer.id))
    .limit(MAX_SOURCES);
  if (existing.length >= MAX_SOURCES) {
    return fail(`You can add up to ${MAX_SOURCES} sources. Remove one first.`);
  }

  await db.insert(stackSources).values({ userId: guard.viewer.id, ...parsed.data });
  revalidatePath("/", "layout");
  return ok();
}

export async function removeStackSource(sourceId: string): Promise<ActionResult> {
  const guard = await guardRole("builder");
  if (!guard.ok) return fail(guard.error);
  if (!z.uuid().safeParse(sourceId).success) return fail("That source no longer exists.");

  // Only the owner's own row matches, so nobody can remove someone else's source.
  const removed = await db
    .delete(stackSources)
    .where(and(eq(stackSources.id, sourceId), eq(stackSources.userId, guard.viewer.id)))
    .returning({ id: stackSources.id });
  if (removed.length === 0) return fail("That source no longer exists.");

  revalidatePath("/", "layout");
  return ok();
}
