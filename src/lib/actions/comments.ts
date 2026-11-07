"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { guardOnboarded } from "@/lib/guards";
import { firstError } from "@/lib/validation/common";
import { commentInputSchema } from "@/lib/validation/post";
import { fail, ok, type ActionResult } from "./result";

export async function addComment(raw: unknown): Promise<ActionResult> {
  const guard = await guardOnboarded();
  if (!guard.ok) return fail(guard.error);

  const parsed = commentInputSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));

  try {
    await db.insert(comments).values({
      postId: parsed.data.postId,
      authorId: guard.viewer.id,
      body: parsed.data.body,
    });
  } catch {
    return fail("That post no longer exists.");
  }

  revalidatePath(`/posts/${parsed.data.postId}`);
  revalidatePath("/feed");
  return ok();
}
