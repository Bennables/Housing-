import type {
  Audience,
  Frequency,
  ListingCategory,
  ListingLevel,
  ListingType,
  UserRole,
} from "@/lib/constants";

// Plain, serializable shapes shared by server data code and components.
// Dates are ISO strings so they can cross into client components.

export type ListingView = {
  id: string;
  slug: string;
  name: string;
  type: ListingType;
  category: ListingCategory;
  level: ListingLevel;
  summary: string;
  eligibility: string | null;
  url: string;
  state: string | null;
  targetAudience: Audience;
  amountMinCents: number | null;
  amountMaxCents: number | null;
  frequency: Frequency | null;
  opensAt: string | null;
  closesAt: string | null;
  sourceCheckedAt: string | null;
  /** The managing agency, or null for listings added by an admin. */
  agencyName: string | null;
  agencyVerified: boolean;
  savedByMe: boolean;
};

export type PostView = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: UserRole;
    agencyName: string | null;
    agencyVerified: boolean;
  };
  listing: ListingView | null;
  benefitCents: number | null;
  benefitFrequency: Frequency | null;
  eligibility: string | null;
  states: string[];
  sourceUrl: string | null;
  targetAudience: Audience;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  canDelete: boolean;
};

export type CommentView = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null; agencyName: string | null; agencyVerified: boolean };
};

export type ListingFilters = {
  audience: Audience | null;
  type?: ListingType;
  category?: ListingCategory;
  level?: ListingLevel;
  state?: string;
  frequency?: Frequency;
  /** "current" (the default) means everything that has not closed. */
  status?: "current" | "open" | "upcoming" | "rolling" | "closed";
  q?: string;
};
