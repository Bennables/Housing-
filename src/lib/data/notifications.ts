import "server-only";
import { and, asc, count, desc, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  emailSubscriptions,
  listings,
  notifications,
  posts,
  savedListings,
  users,
} from "@/db/schema";
import type { NotificationType } from "@/lib/constants";

export const CLOSING_SOON_DAYS = 7;
const PAGE_SIZE = 50;

export type NotificationView = {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actorName: string | null;
  listingName: string | null;
  listingSlug: string | null;
  postId: string | null;
  postSnippet: string | null;
};

/** The bell badge. One indexed count, so it is cheap enough for every page. */
export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}

export async function getNotifications(userId: string): Promise<NotificationView[]> {
  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      actorName: users.name,
      listingName: listings.name,
      listingSlug: listings.slug,
      postId: notifications.postId,
      postBody: posts.body,
    })
    .from(notifications)
    .leftJoin(users, eq(users.id, notifications.actorId))
    .leftJoin(listings, eq(listings.id, notifications.listingId))
    .leftJoin(posts, eq(posts.id, notifications.postId))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(PAGE_SIZE);

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    read: r.readAt !== null,
    createdAt: r.createdAt.toISOString(),
    actorName: r.actorName,
    listingName: r.listingName,
    listingSlug: r.listingSlug,
    postId: r.postId,
    postSnippet: r.postBody ? r.postBody.slice(0, 80) : null,
  }));
}

export type ClosingSoonView = { name: string; slug: string; closesAt: string };

/**
 * Saved listings that close within a week. Worked out when the page loads, so there is no
 * scheduled job and the list is never stale.
 */
export async function getClosingSoon(userId: string): Promise<ClosingSoonView[]> {
  const rows = await db
    .select({ name: listings.name, slug: listings.slug, closesAt: listings.closesAt })
    .from(savedListings)
    .innerJoin(listings, eq(listings.id, savedListings.listingId))
    .where(
      and(
        eq(savedListings.userId, userId),
        gt(listings.closesAt, sql`now()`),
        lte(listings.closesAt, sql`now() + make_interval(days => ${CLOSING_SOON_DAYS})`),
      ),
    )
    .orderBy(asc(listings.closesAt));
  return rows.flatMap((r) =>
    r.closesAt ? [{ name: r.name, slug: r.slug, closesAt: r.closesAt.toISOString() }] : [],
  );
}

/** The email alerts setting, plus the address we would send to (the sign-in email). */
export async function getEmailSettings(
  userId: string,
): Promise<{ accountEmail: string | null; enabled: boolean }> {
  const [row] = await db
    .select({ email: users.email, subscribed: emailSubscriptions.userId })
    .from(users)
    .leftJoin(emailSubscriptions, eq(emailSubscriptions.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  return { accountEmail: row?.email ?? null, enabled: row?.subscribed != null };
}
