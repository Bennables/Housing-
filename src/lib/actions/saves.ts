"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { posts, savedListings, savedPosts } from "@/db/schema";
import { getPublicListingById } from "@/lib/data/listings";
import { guardOnboarded } from "@/lib/guards";
import { fail, ok, type ActionResult } from "./result";

// Saving feeds the builder's Capital Stack and the household estimate, which live in the layout.
const refreshSidebar = () => revalidatePath("/", "layout");

export async function toggleSaveListing(listingId: string): Promise<ActionResult<{ saved: boolean }>> {
  const guard = await guardOnboarded();
  if (!guard.ok) return fail(guard.error);
  if (!z.uuid().safeParse(listingId).success) return fail("That listing is not available.");

  const removed = await db
    .delete(savedListings)
    .where(and(eq(savedListings.listingId, listingId), eq(savedListings.userId, guard.viewer.id)))
    .returning({ listingId: savedListings.listingId });

  let saved = false;
  if (removed.length === 0) {
    // Only public listings can be saved.
    const listing = await getPublicListingById(listingId, null);
    if (!listing) return fail("That listing is not available.");
    await db
      .insert(savedListings)
      .values({ listingId, userId: guard.viewer.id })
      .onConflictDoNothing();
    saved = true;
  }

  refreshSidebar();
  return ok({ saved });
}

export async function toggleSavePost(postId: string): Promise<ActionResult<{ saved: boolean }>> {
  const guard = await guardOnboarded();
  if (!guard.ok) return fail(guard.error);
  if (!z.uuid().safeParse(postId).success) return fail("That post no longer exists.");

  const removed = await db
    .delete(savedPosts)
    .where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, guard.viewer.id)))
    .returning({ postId: savedPosts.postId });

  let saved = false;
  if (removed.length === 0) {
    const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post) return fail("That post no longer exists.");
    await db.insert(savedPosts).values({ postId, userId: guard.viewer.id }).onConflictDoNothing();
    saved = true;
  }

  refreshSidebar();
  return ok({ saved });
}
