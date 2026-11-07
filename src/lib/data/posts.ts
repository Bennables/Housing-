import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "@/db";
import { agencies, comments, likes, listings, posts, savedPosts, users } from "@/db/schema";
import type { Audience } from "@/lib/constants";
import { decodeCursor, FEED_PAGE_SIZE, paginate } from "@/lib/pagination";
import type { Viewer } from "@/lib/session";
import type { CommentView, PostView } from "@/lib/types";
import { listingSavedExpr, toListingView } from "./listings";

const authorAgency = alias(agencies, "author_agency");
const listingAgency = alias(agencies, "listing_agency");

function postSelect(viewerId: string | null) {
  return {
    post: posts,
    authorName: users.name,
    authorImage: users.image,
    authorRole: users.role,
    authorAgencyName: authorAgency.name,
    authorAgencyVerified: authorAgency.verified,
    listing: listings,
    listingAgencyName: listingAgency.name,
    listingAgencyVerified: listingAgency.verified,
    listingSavedByMe: listingSavedExpr(viewerId),
    likeCount: sql<number>`(select count(*)::int from ${likes} where ${likes.postId} = ${posts.id})`,
    commentCount: sql<number>`(select count(*)::int from ${comments} where ${comments.postId} = ${posts.id})`,
    likedByMe: viewerId
      ? sql<boolean>`exists (select 1 from ${likes} where ${likes.postId} = ${posts.id} and ${likes.userId} = ${viewerId})`
      : sql<boolean>`false`,
    savedByMe: viewerId
      ? sql<boolean>`exists (select 1 from ${savedPosts} where ${savedPosts.postId} = ${posts.id} and ${savedPosts.userId} = ${viewerId})`
      : sql<boolean>`false`,
  };
}

type PostRow = Awaited<ReturnType<typeof queryPosts>>[number];

function queryPosts(viewerId: string | null, where: ReturnType<typeof and>, limit: number) {
  return db
    .select(postSelect(viewerId))
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(authorAgency, eq(authorAgency.userId, users.id))
    .leftJoin(listings, eq(listings.id, posts.listingId))
    .leftJoin(listingAgency, eq(listingAgency.id, listings.agencyId))
    .where(where)
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit);
}

function toPostView(row: PostRow, viewer: Viewer | null): PostView {
  // A post that shares a listing from an agency that is not verified yet shows no embedded card.
  const listingIsPublic =
    row.listing && (row.listing.agencyId === null || row.listingAgencyVerified === true);
  return {
    id: row.post.id,
    body: row.post.body,
    createdAt: row.post.createdAt.toISOString(),
    author: {
      id: row.post.authorId,
      name: row.authorName,
      image: row.authorImage,
      role: row.authorRole,
      agencyName: row.authorAgencyName,
      agencyVerified: row.authorAgencyVerified ?? false,
    },
    listing:
      row.listing && listingIsPublic
        ? toListingView({
            listing: row.listing,
            agencyName: row.listingAgencyName,
            agencyVerified: row.listingAgencyVerified,
            savedByMe: row.listingSavedByMe,
          })
        : null,
    benefitCents: row.post.benefitCents,
    benefitFrequency: row.post.benefitFrequency,
    eligibility: row.post.eligibility,
    states: row.post.states,
    sourceUrl: row.post.sourceUrl,
    targetAudience: row.post.targetAudience,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    likedByMe: row.likedByMe,
    savedByMe: row.savedByMe,
    canDelete: !!viewer && (viewer.id === row.post.authorId || viewer.isAdmin),
  };
}

export async function getFeedPage(args: {
  viewer: Viewer | null;
  audience: Audience;
  state?: string;
  cursor?: string | null;
}): Promise<{ posts: PostView[]; nextCursor: string | null }> {
  const cursor = decodeCursor(args.cursor);
  const rows = await queryPosts(
    args.viewer?.id ?? null,
    and(
      inArray(posts.targetAudience, args.audience === "both" ? ["both"] : [args.audience, "both"]),
      // A state filter keeps posts that are not tied to any state, such as federal programs.
      args.state
        ? sql`(cardinality(${posts.states}) = 0 or ${args.state} = any(${posts.states}))`
        : undefined,
      cursor
        ? sql`(${posts.createdAt}, ${posts.id}) < (${cursor.createdAt.toISOString()}::timestamptz, ${cursor.id}::uuid)`
        : undefined,
    ),
    FEED_PAGE_SIZE + 1,
  );
  const page = paginate(
    rows.map((row) => ({ id: row.post.id, createdAt: row.post.createdAt, row })),
    FEED_PAGE_SIZE,
  );
  return {
    posts: page.items.map((item) => toPostView(item.row, args.viewer)),
    nextCursor: page.nextCursor,
  };
}

export async function getPost(id: string, viewer: Viewer | null): Promise<PostView | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const [row] = await queryPosts(viewer?.id ?? null, eq(posts.id, id), 1);
  return row ? toPostView(row, viewer) : null;
}

export async function getComments(postId: string): Promise<CommentView[]> {
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorImage: users.image,
      agencyName: authorAgency.name,
      agencyVerified: authorAgency.verified,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .leftJoin(authorAgency, eq(authorAgency.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt, comments.id)
    .limit(200);
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    author: {
      id: r.authorId,
      name: r.authorName,
      image: r.authorImage,
      agencyName: r.agencyName,
      agencyVerified: r.agencyVerified ?? false,
    },
  }));
}

/** The most recent posts that share a listing, for the listing's own page. */
export async function getPostsForListing(
  listingId: string,
  viewer: Viewer | null,
  limit = 5,
): Promise<PostView[]> {
  const rows = await queryPosts(viewer?.id ?? null, eq(posts.listingId, listingId), limit);
  return rows.map((row) => toPostView(row, viewer));
}
