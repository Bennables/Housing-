"use server";

import { z } from "zod";
import { resolveAudience } from "@/lib/audience";
import { getFeedPage } from "@/lib/data/posts";
import { searchListings } from "@/lib/data/listings";
import { getViewer } from "@/lib/session";
import { isStateCode } from "@/lib/states";
import type { PostView } from "@/lib/types";

const loadMoreSchema = z.object({
  cursor: z.string().max(500),
  audience: z.enum(["builder", "household"]).optional(),
  state: z.string().optional(),
});

/** "Load more" on the feed. Reads only, so it works for signed-out visitors too. */
export async function loadMorePosts(
  raw: unknown,
): Promise<{ posts: PostView[]; nextCursor: string | null } | { error: string }> {
  const parsed = loadMoreSchema.safeParse(raw);
  if (!parsed.success) return { error: "Could not load more posts." };
  const viewer = await getViewer();
  return getFeedPage({
    viewer,
    // Same rule as the page: builders and households see their own side.
    audience: resolveAudience(viewer?.role ?? null, parsed.data.audience),
    state: parsed.data.state && isStateCode(parsed.data.state) ? parsed.data.state : undefined,
    cursor: parsed.data.cursor,
  });
}

/** The composer's listing picker. Listing names are public. */
export async function searchListingsAction(query: string): Promise<{ id: string; name: string }[]> {
  if (typeof query !== "string") return [];
  return searchListings(query);
}
