import type {
  Audience,
  Frequency,
  ListingCategory,
  ListingLevel,
  ListingType,
} from "@/lib/constants";

// Pure helpers for interest matching. No database or network here, so they are easy to test.
//
// Posts have no tags column. Their tags come from data that already exists: the post's audience
// and states, its shared listing's type, category, level and state, and the benefit frequency of
// an unlisted post.

export type TagSource = {
  targetAudience: Audience;
  states: string[];
  benefitFrequency: Frequency | null;
  listing: {
    type: ListingType;
    category: ListingCategory;
    level: ListingLevel;
    state: string | null;
    frequency: Frequency | null;
  } | null;
};

/** Tags look like "category:adu" or "state:CA". Each tag appears at most once per post. */
export function postTags(source: TagSource): string[] {
  const tags = new Set<string>([`audience:${source.targetAudience}`]);
  for (const state of source.states) tags.add(`state:${state}`);
  if (source.listing) {
    tags.add(`type:${source.listing.type}`);
    tags.add(`category:${source.listing.category}`);
    tags.add(`level:${source.listing.level}`);
    if (source.listing.state) tags.add(`state:${source.listing.state}`);
    if (source.listing.frequency) tags.add(`frequency:${source.listing.frequency}`);
  } else if (source.benefitFrequency) {
    tags.add(`frequency:${source.benefitFrequency}`);
  }
  return [...tags].sort();
}

export type InterestProfile = Record<string, number>;

/** Adds up tags across the posts someone viewed, weighted by how many times they opened each. */
export function buildInterestProfile(
  views: { viewCount: number; tags: string[] }[],
): InterestProfile {
  const profile: InterestProfile = {};
  for (const view of views) {
    const weight = Math.max(1, view.viewCount);
    for (const tag of view.tags) profile[tag] = (profile[tag] ?? 0) + weight;
  }
  return profile;
}

/** The strongest tags first, capped so a long history does not blow up the prompt. */
export function topTags(profile: InterestProfile, limit = 15): InterestProfile {
  return Object.fromEntries(
    Object.entries(profile)
      .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
      .slice(0, limit),
  );
}

const SMS_MAX = 300;

/**
 * The text message. It says plainly that this is a community post, not an official notice,
 * and always ends with the opt-out line.
 */
export function buildSmsText(args: { postUrl: string; listingName: string | null }): string {
  const about = args.listingName ? ` about ${args.listingName}` : "";
  const head = "Closing the Gap: A community post";
  const tail = ` may interest you. It is not an official notice, so check the source. ${args.postUrl} Reply STOP to opt out.`;
  const room = SMS_MAX - head.length - tail.length;
  const trimmedAbout = about.length > room ? `${about.slice(0, Math.max(0, room - 1))}…` : about;
  return `${head}${trimmedAbout}${tail}`;
}
