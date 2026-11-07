import "server-only";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { agencies, capitalStacks, listings, posts, savedListings, savedPosts } from "@/db/schema";
import type { StackItem } from "@/lib/capital-stack";
import { potentialCents } from "@/lib/money";
import { isPublicListing } from "./listings";

/** Everything the user saved, as items with the amount and frequency that apply to each. */
export async function getSavedItems(userId: string): Promise<StackItem[]> {
  const [listingRows, postRows] = await Promise.all([
    db
      .select({
        id: listings.id,
        name: listings.name,
        min: listings.amountMinCents,
        max: listings.amountMaxCents,
        frequency: listings.frequency,
      })
      .from(savedListings)
      .innerJoin(listings, eq(listings.id, savedListings.listingId))
      .leftJoin(agencies, eq(agencies.id, listings.agencyId))
      .where(and(eq(savedListings.userId, userId), isPublicListing)),
    db
      .select({
        id: posts.id,
        body: posts.body,
        listingId: posts.listingId,
        benefitCents: posts.benefitCents,
        benefitFrequency: posts.benefitFrequency,
        listingName: listings.name,
        min: listings.amountMinCents,
        max: listings.amountMaxCents,
        frequency: listings.frequency,
      })
      .from(savedPosts)
      .innerJoin(posts, eq(posts.id, savedPosts.postId))
      .leftJoin(listings, eq(listings.id, posts.listingId))
      .where(eq(savedPosts.userId, userId)),
  ]);

  const items: StackItem[] = listingRows.map((r) => ({
    id: r.id,
    kind: "listing",
    title: r.name,
    amountCents: potentialCents(r.min, r.max),
    frequency: r.frequency,
  }));

  for (const r of postRows) {
    // A post that shares a listing uses the listing's amounts. One source of truth.
    const fromListing = r.listingId !== null;
    items.push({
      id: r.id,
      kind: "post",
      title: fromListing && r.listingName ? r.listingName : truncate(r.body, 70),
      amountCents: fromListing ? potentialCents(r.min, r.max) : r.benefitCents,
      frequency: fromListing ? r.frequency : r.benefitFrequency,
    });
  }
  return items;
}

export async function getCapitalStack(userId: string) {
  const [stack] = await db
    .select()
    .from(capitalStacks)
    .where(eq(capitalStacks.userId, userId))
    .limit(1);
  return stack ?? null;
}

function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/** How many listings and posts the user saved. Used by the profile card. */
export async function getSavedCounts(userId: string): Promise<{ listings: number; posts: number }> {
  const [[listingRow], [postRow]] = await Promise.all([
    db.select({ n: count() }).from(savedListings).where(eq(savedListings.userId, userId)),
    db.select({ n: count() }).from(savedPosts).where(eq(savedPosts.userId, userId)),
  ]);
  return { listings: listingRow?.n ?? 0, posts: postRow?.n ?? 0 };
}
