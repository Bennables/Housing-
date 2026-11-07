import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { emailSubscriptions, listings, notifications, posts, users } from "@/db/schema";
import type { Audience } from "@/lib/constants";
import { isEmailConfigured, sendEmail, sendIntervalMs } from "@/lib/email";
import { appUrl, newListingEmail } from "@/lib/email-message";

// Fan-out on write: when something happens we write the notification rows right away.
// Reading them later is then a single indexed lookup, not a matching job.
// These helpers never throw. A notification problem must not fail the action that caused it.

const SEND_BATCH = 10;
// Stay well inside a serverless function's time limit. Anything left over is sent by the next run.
const SEND_TIME_BUDGET_MS = 45_000;

function rolesFor(audience: Audience): ("builder" | "household")[] {
  return audience === "both" ? ["builder", "household"] : [audience];
}

/** Tell every builder and/or household user that a new official listing matches them. */
export async function notifyNewListing(listing: {
  id: string;
  targetAudience: Audience;
  createdById: string;
}): Promise<void> {
  try {
    const emailOn = isEmailConfigured();
    const roles = sql.join(
      rolesFor(listing.targetAudience).map((role) => sql`${role}`),
      sql`, `,
    );
    // One statement for everyone who matches. Drizzle's typed insert-select wants every column
    // of the table in order, so this one is written as plain SQL.
    await db.execute(sql`
      insert into ${notifications} (user_id, type, listing_id, dedupe_key, email_status)
      select
        ${users.id},
        'new_listing'::notification_type,
        ${listing.id}::uuid,
        ${`new_listing:${listing.id}`},
        case when ${emailOn}::boolean
            and ${emailSubscriptions.userId} is not null
            and ${users.email} is not null
          then 'pending'::email_status else 'none'::email_status end
      from ${users}
      left join ${emailSubscriptions} on ${emailSubscriptions.userId} = ${users.id}
      where ${users.role} in (${roles}) and ${users.id} <> ${listing.createdById}
      on conflict (user_id, dedupe_key) do nothing
    `);
  } catch (error) {
    console.error("notifyNewListing failed", error);
  }
}

/** Tell a post's author that someone liked or commented on it. Not when they do it to themselves. */
export async function notifyPostAuthor(event: {
  type: "comment" | "like";
  postId: string;
  actorId: string;
  dedupeKey: string;
}): Promise<void> {
  try {
    const [post] = await db
      .select({ authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.id, event.postId))
      .limit(1);
    if (!post || post.authorId === event.actorId) return;
    await db
      .insert(notifications)
      .values({
        userId: post.authorId,
        type: event.type,
        actorId: event.actorId,
        postId: event.postId,
        dedupeKey: event.dedupeKey,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error("notifyPostAuthor failed", error);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send queued emails through Amazon SES. Call it from `after()` so the person who triggered the
 * notification never waits on it. Rows are claimed with one atomic UPDATE, so two runs at once
 * cannot send the same email twice. Emails go out one at a time, at the rate SES allows.
 */
export async function deliverPendingEmail(): Promise<void> {
  try {
    if (!isEmailConfigured()) return;
    const started = Date.now();
    const baseUrl = appUrl();

    while (Date.now() - started < SEND_TIME_BUDGET_MS) {
      const claimed = await db
        .update(notifications)
        .set({ emailStatus: "sending" })
        .where(
          and(
            eq(notifications.emailStatus, "pending"),
            inArray(
              notifications.id,
              db
                .select({ id: notifications.id })
                .from(notifications)
                .where(eq(notifications.emailStatus, "pending"))
                .orderBy(notifications.createdAt)
                .limit(SEND_BATCH),
            ),
          ),
        )
        .returning({ id: notifications.id });
      if (claimed.length === 0) return;

      const rows = await db
        .select({
          id: notifications.id,
          email: users.email,
          optedIn: emailSubscriptions.userId,
          name: listings.name,
          summary: listings.summary,
          slug: listings.slug,
        })
        .from(notifications)
        .innerJoin(users, eq(users.id, notifications.userId))
        .leftJoin(emailSubscriptions, eq(emailSubscriptions.userId, notifications.userId))
        .leftJoin(listings, eq(listings.id, notifications.listingId))
        .where(
          inArray(
            notifications.id,
            claimed.map((c) => c.id),
          ),
        );

      const setStatus = (id: string, values: Partial<typeof notifications.$inferInsert>) =>
        db.update(notifications).set(values).where(eq(notifications.id, id));

      for (const [index, row] of rows.entries()) {
        // They turned alerts off, or the listing is gone, between queueing and sending.
        if (!row.optedIn || !row.email || !row.name || !row.summary || !row.slug) {
          await setStatus(row.id, { emailStatus: row.optedIn ? "failed" : "none" });
          continue;
        }
        const result = await sendEmail(
          row.email,
          newListingEmail({ name: row.name, summary: row.summary, slug: row.slug }, baseUrl),
        );
        if (result.ok) {
          await setStatus(row.id, { emailStatus: "sent", emailSentAt: new Date() });
        } else if (result.retryable) {
          // SES asked us to slow down. Put this and the rest of the batch back for the next run.
          console.error(`Email throttled: ${result.error}`);
          await db
            .update(notifications)
            .set({ emailStatus: "pending" })
            .where(
              inArray(
                notifications.id,
                rows.slice(index).map((r) => r.id),
              ),
            );
          return;
        } else {
          console.error(`Email for notification ${row.id} failed: ${result.error}`);
          await setStatus(row.id, { emailStatus: "failed" });
        }
        if (index < rows.length - 1) await sleep(sendIntervalMs());
      }
      await sleep(sendIntervalMs());
    }
  } catch (error) {
    console.error("deliverPendingEmail failed", error);
  }
}
