"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { emailSubscriptions, notifications, users } from "@/db/schema";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { appUrl, confirmationEmail } from "@/lib/email-message";
import { guardOnboarded, guardSignedIn } from "@/lib/guards";
import { firstError } from "@/lib/validation/common";
import { emailOptInSchema } from "@/lib/validation/notifications";
import { fail, ok, type ActionResult } from "./result";

// The bell lives in the root layout header, so refresh the whole tree.
const refreshBell = () => revalidatePath("/", "layout");

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const guard = await guardSignedIn();
  if (!guard.ok) return fail(guard.error);

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, guard.viewer.id), isNull(notifications.readAt)));

  refreshBell();
  return ok();
}

/** Turn on email alerts. Sends one confirmation email to the address the person signed in with. */
export async function enableEmailAlerts(raw: unknown): Promise<ActionResult> {
  const guard = await guardOnboarded();
  if (!guard.ok) return fail(guard.error);
  if (guard.viewer.role !== "household" && guard.viewer.role !== "builder") {
    return fail("Email alerts are for households and builders.");
  }
  if (!isEmailConfigured()) return fail("Email alerts are not available right now.");

  const parsed = emailOptInSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));

  const [account] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, guard.viewer.id))
    .limit(1);
  if (!account?.email) return fail("Your account does not have an email address.");

  const [existing] = await db
    .select({ userId: emailSubscriptions.userId })
    .from(emailSubscriptions)
    .where(eq(emailSubscriptions.userId, guard.viewer.id))
    .limit(1);
  if (existing) return ok();

  const sent = await sendEmail(account.email, confirmationEmail(appUrl()));
  if (!sent.ok) {
    console.error(`Email confirmation to user ${guard.viewer.id} failed: ${sent.error}`);
    return fail("We could not send an email to your address. Try again in a few minutes.");
  }

  await db.insert(emailSubscriptions).values({ userId: guard.viewer.id }).onConflictDoNothing();
  revalidatePath("/profile");
  return ok();
}

export async function disableEmailAlerts(): Promise<ActionResult> {
  const guard = await guardSignedIn();
  if (!guard.ok) return fail(guard.error);

  await db.delete(emailSubscriptions).where(eq(emailSubscriptions.userId, guard.viewer.id));
  revalidatePath("/profile");
  return ok();
}
