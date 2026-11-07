"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { likes } from "@/db/schema";
import { guardOnboarded } from "@/lib/guards";
import { notifyPostAuthor } from "@/lib/notify";
import { fail, ok, type ActionResult } from "./result";

export async function toggleLike(postId: string): Promise<ActionResult<{ liked: boolean }>> {
  const guard = await guardOnboarded();
  if (!guard.ok) return fail(guard.error);
  if (!z.uuid().safeParse(postId).success) return fail("That post no longer exists.");

  const removed = await db
    .delete(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, guard.viewer.id)))
    .returning({ postId: likes.postId });

  let liked = false;
  if (removed.length === 0) {
    try {
      await db.insert(likes).values({ postId, userId: guard.viewer.id }).onConflictDoNothing();
      liked = true;
      // One notification per person per post, so like, unlike, like does not repeat it.
      await notifyPostAuthor({
        type: "like",
        postId,
        actorId: guard.viewer.id,
        dedupeKey: `like:${postId}:${guard.viewer.id}`,
      });
    } catch {
      return fail("That post no longer exists.");
    }
  }

  revalidatePath("/feed");
  revalidatePath(`/posts/${postId}`);
  return ok({ liked });
}
