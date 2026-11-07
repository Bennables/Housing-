import type { Metadata } from "next";
import { AudienceToggle } from "@/components/audience-toggle";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingFiltersForm } from "@/components/listings/listing-filters";
import { viewerStateOf } from "@/components/viewer-state";
import { hasAudienceToggle, resolveAudience } from "@/lib/audience";
import { FREQUENCIES, LISTING_CATEGORIES, LISTING_LEVELS, LISTING_TYPES } from "@/lib/constants";
import { getListings } from "@/lib/data/listings";
import { first, oneOf, type SearchParams } from "@/lib/params";
import { getViewer } from "@/lib/session";
import { isStateCode } from "@/lib/states";
import type { ListingFilters } from "@/lib/types";

export const metadata: Metadata = { title: "Listings" };

const STATUSES = ["current", "open", "upcoming", "rolling", "closed"] as const;

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const audience = resolveAudience(viewer?.role ?? null, first(sp.audience));
  const state = first(sp.state);

  const filters: ListingFilters = {
    audience,
    type: oneOf(first(sp.type), LISTING_TYPES),
    category: oneOf(first(sp.category), LISTING_CATEGORIES),
    level: oneOf(first(sp.level), LISTING_LEVELS),
    state: state && isStateCode(state) ? state : undefined,
    frequency: oneOf(first(sp.frequency), FREQUENCIES),
    status: oneOf(first(sp.status), STATUSES),
    q: first(sp.q)?.slice(0, 80),
  };

  const listings = await getListings(filters, viewer?.id ?? null);
  const viewerState = viewerStateOf(viewer);
  const toggle = hasAudienceToggle(viewer?.role ?? null);
  const closed = filters.status === "closed";

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Listings</h1>
        <p className="text-sm text-muted-foreground">
          Official programs, grants, loans and bonuses from verified agencies, with a link to the source for each.
        </p>
      </div>

      {toggle ? (
        <AudienceToggle
          basePath="/listings"
          current={audience}
          params={{
            q: filters.q,
            status: filters.status,
            type: filters.type,
            category: filters.category,
            level: filters.level,
            state: filters.state,
            frequency: filters.frequency,
          }}
        />
      ) : null}

      <ListingFiltersForm filters={filters} showAudience={toggle} audience={audience} />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {listings.length} {listings.length === 1 ? "listing" : "listings"}
        {closed ? " (past)" : ""}
      </p>

      {listings.length === 0 ? (
        <EmptyState title={closed ? "No past listings match" : "No listings match"}>
          Try removing a filter or searching for a different name.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {listings.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} viewerState={viewerState} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
