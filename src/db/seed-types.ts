import type {
  Audience,
  Frequency,
  ListingCategory,
  ListingLevel,
  ListingType,
} from "../lib/constants";

export type SeedListing = {
  slug: string;
  name: string;
  type: ListingType;
  category: ListingCategory;
  level: ListingLevel;
  state: string | null;
  summary: string;
  eligibility: string | null;
  url: string;
  targetAudience: Audience;
  amountMinCents: number | null;
  amountMaxCents: number | null;
  frequency: Frequency | null;
  opensAt: Date | null;
  closesAt: Date | null;
  sourceCheckedAt: string | null;
};

export type SeedPost = {
  /** Demo account that "writes" the post. Posts are only seeded in demo mode. */
  author: "demo-household" | "demo-builder";
  body: string;
  /** Share a seeded listing by slug. Without one, a sourceUrl is required. */
  listingSlug?: string;
  sourceUrl?: string;
  states?: string[];
  targetAudience: Audience;
};

export const CHECKED = "2026-11-07";
export const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
