import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { agencies, listings, posts, savedListings } from "@/db/schema";

export async function getAgencyForUser(userId: string) {
  const [agency] = await db.select().from(agencies).where(eq(agencies.userId, userId)).limit(1);
  return agency ?? null;
}

/** The agency's own listings, with how many posts share each one and how many people saved it. */
export async function getAgencyListings(agencyId: string) {
  return db
    .select({
      listing: listings,
      postCount: sql<number>`(select count(*)::int from ${posts} where ${posts.listingId} = ${listings.id})`,
      saveCount: sql<number>`(select count(*)::int from ${savedListings} where ${savedListings.listingId} = ${listings.id})`,
    })
    .from(listings)
    .where(eq(listings.agencyId, agencyId))
    .orderBy(desc(listings.createdAt))
    .limit(200);
}

export async function getAgencyListing(id: string, agencyId: string) {
  const [row] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, id), eq(listings.agencyId, agencyId)))
    .limit(1);
  return row ?? null;
}
