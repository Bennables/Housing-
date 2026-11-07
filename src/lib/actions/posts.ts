"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { posts, reports } from "@/db/schema";
import { audienceForRole } from "@/lib/audience";
import { getPublicListingById } from "@/lib/data/listings";
import { notifyMatchesForPost } from "@/lib/notify/match";
import { guardOnboarded, guardSignedIn } from "@/lib/guards";
import { postInputSchema, reportInputSchema } from "@/lib/validation/post";
import { firstError } from "@/lib/validation/common";
import { fail, ok, type ActionResult } from "./result";

export async function createPost(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const guard = await guardOnboarded();
  if (!guard.ok) return fail(guard.error);

  const parsed = postInputSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));
  const input = parsed.data;

  // The audience comes from the shared listing, or from the author's own role. Never from the form.
  let targetAudience = audienceForRole(guard.viewer.role);
  if (input.listingId) {
    const listing = await getPublicListingById(input.listingId, null);
    if (!listing) return fail("That listing is not available.");
    targetAudience = listing.targetAudience;
  }

  const [row] = await db
    .insert(posts)
    .values({
      authorId: guard.viewer.id,
      body: input.body,
      listingId: input.listingId,
      benefitCents: input.benefitCents,
      benefitFrequency: input.benefitFrequency,
      eligibility: input.eligibility,
      states: input.states,
      sourceUrl: input.sourceUrl,
      targetAudience,
    })
    .returning({ id: posts.id });

  revalidatePath("/feed");
  // Text people who may care about this post. Runs after the response, so posting stays fast.
  after(() => notifyMatchesForPost(row.id));
  return ok({ id: row.id });
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const guard = await guardSignedIn();
  if (!guard.ok) return fail(guard.error);
  if (!z.uuid().safeParse(postId).success) return fail("That post no longer exists.");

  const [post] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!post) return fail("That post no longer exists.");

  // Authors delete their own posts. Admins can delete any post.
  if (post.authorId !== guard.viewer.id && !guard.viewer.isAdmin) {
    return fail("You can only delete your own posts.");
  }

  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath("/feed");
  revalidatePath("/admin");
  return ok();
}

export async function reportPost(raw: unknown): Promise<ActionResult> {
  const guard = await guardOnboarded();
  if (!guard.ok) return fail(guard.error);

  const parsed = reportInputSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));

  const [post] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, parsed.data.postId))
    .limit(1);
  if (!post) return fail("That post no longer exists.");
  if (post.authorId === guard.viewer.id) return fail("You cannot report your own post.");

  // One report per person per post. Reporting again is a quiet no-op.
  await db
    .insert(reports)
    .values({ postId: parsed.data.postId, reporterId: guard.viewer.id, reason: parsed.data.reason })
    .onConflictDoNothing();

  revalidatePath("/admin");
  return ok();
}
