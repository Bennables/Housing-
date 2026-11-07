import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings, posts, postViews } from "@/db/schema";
import { buildInterestProfile, postTags, type InterestProfile } from "@/lib/interests";

/** Counts a signed-in person opening a post. Repeat visits bump the count. */
export async function recordPostView(userId: string, postId: string): Promise<void> {
  await db
    .insert(postViews)
    .values({ userId, postId })
    .onConflictDoUpdate({
      target: [postViews.userId, postViews.postId],
      set: { viewCount: sql`${postViews.viewCount} + 1`, viewedAt: sql`now()` },
    });
}

// Enough recent history per batch to build useful profiles without a heavy query.
const MAX_VIEW_ROWS = 2000;

/**
 * Interest profiles for many people in one query, like { "category:adu": 4, "state:CA": 5 }.
 * Tags are derived from each viewed post and its listing at read time.
 */
export async function getInterestProfiles(
  userIds: string[],
): Promise<Map<string, InterestProfile>> {
  const profiles = new Map<string, InterestProfile>();
  if (userIds.length === 0) return profiles;

  const rows = await db
    .select({
      userId: postViews.userId,
      viewCount: postViews.viewCount,
      targetAudience: posts.targetAudience,
      states: posts.states,
      benefitFrequency: posts.benefitFrequency,
      listingType: listings.type,
      listingCategory: listings.category,
      listingLevel: listings.level,
      listingState: listings.state,
      listingFrequency: listings.frequency,
    })
    .from(postViews)
    .innerJoin(posts, eq(posts.id, postViews.postId))
    .leftJoin(listings, eq(listings.id, posts.listingId))
    .where(inArray(postViews.userId, userIds))
    .orderBy(desc(postViews.viewedAt))
    .limit(MAX_VIEW_ROWS);

  const byUser = new Map<string, { viewCount: number; tags: string[] }[]>();
  for (const row of rows) {
    const tags = postTags({
      targetAudience: row.targetAudience,
      states: row.states,
      benefitFrequency: row.benefitFrequency,
      listing:
        row.listingType && row.listingCategory && row.listingLevel
          ? {
              type: row.listingType,
              category: row.listingCategory,
              level: row.listingLevel,
              state: row.listingState,
              frequency: row.listingFrequency,
            }
          : null,
    });
    const list = byUser.get(row.userId) ?? [];
    list.push({ viewCount: row.viewCount, tags });
    byUser.set(row.userId, list);
  }
  for (const [userId, views] of byUser) profiles.set(userId, buildInterestProfile(views));
  return profiles;
}
