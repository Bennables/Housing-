import "server-only";
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { agencies, listings, savedListings } from "@/db/schema";
import type { ListingFilters, ListingView } from "@/lib/types";

/** True when the viewer has saved the listing. Always false when signed out. */
export function listingSavedExpr(viewerId: string | null) {
  return viewerId
    ? sql<boolean>`exists (select 1 from ${savedListings} where ${savedListings.listingId} = ${listings.id} and ${savedListings.userId} = ${viewerId})`
    : sql<boolean>`false`;
}

export function listingSelect(viewerId: string | null) {
  return {
    listing: listings,
    agencyName: agencies.name,
    agencyVerified: agencies.verified,
    savedByMe: listingSavedExpr(viewerId),
  };
}

type ListingRow = {
  listing: typeof listings.$inferSelect;
  agencyName: string | null;
  agencyVerified: boolean | null;
  savedByMe: boolean;
};

export function toListingView(row: ListingRow): ListingView {
  const l = row.listing;
  return {
    id: l.id,
    slug: l.slug,
    name: l.name,
    type: l.type,
    category: l.category,
    level: l.level,
    summary: l.summary,
    eligibility: l.eligibility,
    url: l.url,
    state: l.state,
    targetAudience: l.targetAudience,
    amountMinCents: l.amountMinCents,
    amountMaxCents: l.amountMaxCents,
    frequency: l.frequency,
    opensAt: l.opensAt?.toISOString() ?? null,
    closesAt: l.closesAt?.toISOString() ?? null,
    sourceCheckedAt: l.sourceCheckedAt,
    agencyName: row.agencyName,
    agencyVerified: row.agencyVerified ?? false,
    savedByMe: row.savedByMe,
  };
}

/**
 * Public means created by an admin (no agency) or by a verified agency.
 * Listings from an unverified agency stay hidden until an admin verifies the agency.
 * Callers must join agencies on listings.agencyId.
 */
export const isPublicListing = or(isNull(listings.agencyId), eq(agencies.verified, true));

export function audienceCondition(
  audience: ListingFilters["audience"],
  column: typeof listings.targetAudience,
) {
  if (!audience) return undefined;
  return inArray(column, audience === "both" ? ["both"] : [audience, "both"]);
}

// Status is computed from the dates, never stored. These mirror computeStatus in lib/listing-status.
export function statusCondition(status: NonNullable<ListingFilters["status"]>): SQL {
  switch (status) {
    case "closed":
      return sql`${listings.closesAt} <= now()`;
    case "current":
      return sql`(${listings.closesAt} is null or ${listings.closesAt} > now())`;
    case "upcoming":
      return sql`(${listings.opensAt} > now() and (${listings.closesAt} is null or ${listings.closesAt} > now()))`;
    case "rolling":
      return sql`(${listings.opensAt} is null and ${listings.closesAt} is null)`;
    case "open":
      return sql`((${listings.opensAt} is null or ${listings.opensAt} <= now()) and (${listings.closesAt} is null or ${listings.closesAt} > now()) and (${listings.opensAt} is not null or ${listings.closesAt} is not null))`;
  }
}

export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function getListings(
  filters: ListingFilters,
  viewerId: string | null,
): Promise<ListingView[]> {
  const status = filters.status ?? "current";
  const rows = await db
    .select(listingSelect(viewerId))
    .from(listings)
    .leftJoin(agencies, eq(agencies.id, listings.agencyId))
    .where(
      and(
        isPublicListing,
        audienceCondition(filters.audience, listings.targetAudience),
        filters.type ? eq(listings.type, filters.type) : undefined,
        filters.category ? eq(listings.category, filters.category) : undefined,
        filters.level ? eq(listings.level, filters.level) : undefined,
        // A state filter keeps federal listings, since they apply everywhere.
        filters.state ? or(eq(listings.state, filters.state), isNull(listings.state)) : undefined,
        filters.frequency ? eq(listings.frequency, filters.frequency) : undefined,
        statusCondition(status),
        filters.q ? ilike(listings.name, `%${escapeLike(filters.q)}%`) : undefined,
      ),
    )
    .orderBy(status === "closed" ? desc(listings.closesAt) : asc(listings.name))
    .limit(200);
  return rows.map(toListingView);
}

export async function getListingBySlug(
  slug: string,
  viewerId: string | null,
): Promise<ListingView | null> {
  const [row] = await db
    .select(listingSelect(viewerId))
    .from(listings)
    .leftJoin(agencies, eq(agencies.id, listings.agencyId))
    .where(and(eq(listings.slug, slug), isPublicListing))
    .limit(1);
  return row ? toListingView(row) : null;
}

export async function getPublicListingById(
  id: string,
  viewerId: string | null,
): Promise<ListingView | null> {
  const [row] = await db
    .select(listingSelect(viewerId))
    .from(listings)
    .leftJoin(agencies, eq(agencies.id, listings.agencyId))
    .where(and(eq(listings.id, id), isPublicListing))
    .limit(1);
  return row ? toListingView(row) : null;
}

/** For the composer's picker. */
export async function searchListings(query: string): Promise<{ id: string; name: string }[]> {
  const q = query.trim().slice(0, 80);
  return db
    .select({ id: listings.id, name: listings.name })
    .from(listings)
    .leftJoin(agencies, eq(agencies.id, listings.agencyId))
    .where(and(isPublicListing, q ? ilike(listings.name, `%${escapeLike(q)}%`) : undefined))
    .orderBy(asc(listings.name))
    .limit(8);
}
