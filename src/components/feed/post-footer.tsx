"use client";

import { Heart, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { ACTION_CLASS } from "@/components/feed/action-style";
import { DeletePostButton } from "@/components/feed/delete-post-button";
import { ReportButton } from "@/components/feed/report-button";
import { SaveButton } from "@/components/feed/save-button";
import { promptHref, type ViewerState } from "@/components/viewer-state";
import { toggleLike } from "@/lib/actions/likes";
import type { PostView } from "@/lib/types";
import { cn } from "@/lib/utils";

type LikeState = { liked: boolean; count: number };

/** The counts line and the action bar under a post. Likes update optimistically. */
export function PostFooter({
  post,
  viewerState,
  viewerId,
  detail,
  onDeleted,
}: {
  post: PostView;
  viewerState: ViewerState;
  viewerId: string | null;
  detail: boolean;
  onDeleted?: (id: string) => void;
}) {
  const router = useRouter();
  const path = `/posts/${post.id}`;
  const [confirmed, setConfirmed] = useState<LikeState>({
    liked: post.likedByMe,
    count: post.likeCount,
  });
  const [optimistic, setOptimistic] = useOptimistic(confirmed, (_s, next: LikeState) => next);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function like() {
    const prompt = promptHref(viewerState, path);
    if (prompt) {
      router.push(prompt);
      return;
    }
    setError(null);
    startTransition(async () => {
      setOptimistic({
        liked: !confirmed.liked,
        count: confirmed.count + (confirmed.liked ? -1 : 1),
      });
      const result = await toggleLike(post.id);
      if (result.ok) {
        // Use the server's answer, so a double click or a stale card still ends up right.
        const delta = result.data.liked === confirmed.liked ? 0 : result.data.liked ? 1 : -1;
        setConfirmed({ liked: result.data.liked, count: confirmed.count + delta });
      } else {
        setError(result.error);
      }
    });
  }

  const comments = post.commentCount;
  const isOwn = viewerId === post.author.id;

  return (
    <div className="mt-3">
      {optimistic.count > 0 || comments > 0 ? (
        <div className="flex items-center justify-between px-1 pb-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {optimistic.count > 0 ? (
              <>
                <Heart className="size-3.5 fill-rose-500 text-rose-500" aria-hidden />
                {optimistic.count} {optimistic.count === 1 ? "like" : "likes"}
              </>
            ) : null}
          </span>
          {comments > 0 ? (
            detail ? (
              <span>
                {comments} {comments === 1 ? "comment" : "comments"}
              </span>
            ) : (
              <Link href={path} className="hover:text-primary hover:underline">
                {comments} {comments === 1 ? "comment" : "comments"}
              </Link>
            )
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center border-t pt-1">
        <button
          type="button"
          onClick={like}
          aria-pressed={optimistic.liked}
          aria-label={optimistic.liked ? "Unlike this post" : "Like this post"}
          className={cn(ACTION_CLASS, optimistic.liked && "text-primary")}
        >
          <Heart className={cn("size-5", optimistic.liked && "fill-current")} aria-hidden />
          {optimistic.liked ? "Liked" : "Like"}
        </button>
        {detail ? (
          <span className={cn(ACTION_CLASS, "hover:bg-transparent")}>
            <MessageSquare className="size-5" aria-hidden />
            Comment
          </span>
        ) : (
          <Link href={path} className={ACTION_CLASS}>
            <MessageSquare className="size-5" aria-hidden />
            Comment
          </Link>
        )}
        <SaveButton
          kind="post"
          id={post.id}
          saved={post.savedByMe}
          viewerState={viewerState}
          next={path}
          className={ACTION_CLASS}
        />
        {!isOwn ? (
          <ReportButton postId={post.id} viewerState={viewerState} className={ACTION_CLASS} />
        ) : null}
        {post.canDelete ? (
          <DeletePostButton
            postId={post.id}
            onDeleted={onDeleted}
            redirectTo={detail ? "/feed" : undefined}
            className={ACTION_CLASS}
          />
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="px-2 pt-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
