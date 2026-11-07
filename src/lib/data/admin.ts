import "server-only";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { agencies, listings, posts, reports, users } from "@/db/schema";

export async function getPendingAgencies() {
  return db
    .select({
      id: agencies.id,
      name: agencies.name,
      level: agencies.level,
      website: agencies.website,
      createdAt: agencies.createdAt,
      userEmail: users.email,
      userName: users.name,
    })
    .from(agencies)
    .innerJoin(users, eq(users.id, agencies.userId))
    .where(eq(agencies.verified, false))
    .orderBy(asc(agencies.createdAt));
}

export async function getReportedPosts() {
  return db
    .select({
      postId: posts.id,
      body: posts.body,
      sourceUrl: posts.sourceUrl,
      authorName: users.name,
      reportCount: sql<number>`count(${reports.id})::int`,
      reasons: sql<string[]>`array_agg(distinct ${reports.reason})`,
      latestReportAt: sql<string>`max(${reports.createdAt})`,
    })
    .from(reports)
    .innerJoin(posts, eq(posts.id, reports.postId))
    .innerJoin(users, eq(users.id, posts.authorId))
    .groupBy(posts.id, users.id)
    .orderBy(desc(sql`max(${reports.createdAt})`))
    .limit(100);
}

export async function getAdminListings() {
  return db.select().from(listings).where(sql`${listings.agencyId} is null`).orderBy(asc(listings.name)).limit(200);
}

export async function getAnyListing(id: string) {
  const [row] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  return row ?? null;
}
