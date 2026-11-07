"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { guardOnboarded } from "@/lib/guards";
import { notifyPostAuthor } from "@/lib/notify";
import { firstError } from "@/lib/validation/common";
import { commentInputSchema } from "@/lib/validation/post";
import { fail, ok, type ActionResult } from "./result";

export async function addComment(raw: unknown): Promise<ActionResult> {
  const guard = await guardOnboarded();
  if (!guard.ok) return fail(guard.error);

  const parsed = commentInputSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));

  let commentId: string;
  try {
    const [row] = await db
      .insert(comments)
      .values({
        postId: parsed.data.postId,
        authorId: guard.viewer.id,
        body: parsed.data.body,
      })
      .returning({ id: comments.id });
    commentId = row.id;
  } catch {
    return fail("That post no longer exists.");
  }

  await notifyPostAuthor({
    type: "comment",
    postId: parsed.data.postId,
    actorId: guard.viewer.id,
    dedupeKey: `comment:${commentId}`,
  });

  revalidatePath(`/posts/${parsed.data.postId}`);
  revalidatePath("/feed");
  return ok();
}
