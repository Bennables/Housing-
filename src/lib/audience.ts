import type { Audience, UserRole } from "@/lib/constants";

/** The audience a new post gets when it does not share a listing. */
export function audienceForRole(role: UserRole): Audience {
  if (role === "builder") return "builder";
  if (role === "household") return "household";
  return "both";
}

export type BrowseAudience = "builder" | "household";

/**
 * Which side of the site a person sees. Builders and households see their own side.
 * Signed-out people and agencies get a Builder/Household toggle, driven by the URL.
 * Items for "both" appear on both sides.
 */
export function resolveAudience(role: UserRole | null, param: string | undefined): BrowseAudience {
  if (role === "builder") return "builder";
  if (role === "household") return "household";
  return param === "builder" ? "builder" : "household";
}

export function hasAudienceToggle(role: UserRole | null): boolean {
  return role !== "builder" && role !== "household";
}
