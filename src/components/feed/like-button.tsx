"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { promptHref, type ViewerState } from "@/components/viewer-state";
import { toggleLike } from "@/lib/actions/likes";
import { cn } from "@/lib/utils";

type LikeState = { liked: boolean; count: number };

export function LikeButton({
  postId,
  liked,
  count,
  viewerState,
}: {
  postId: string;
  liked: boolean;
  count: number;
  viewerState: ViewerState;
}) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<LikeState>({ liked, count });
  const [optimistic, setOptimistic] = useOptimistic(confirmed, (_current, next: LikeState) => next);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onClick() {
    const prompt = promptHref(viewerState, `/posts/${postId}`);
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
      const result = await toggleLike(postId);
      if (result.ok) {
        // Use the server's answer, so a double click or a stale card still ends up right.
        const delta = result.data.liked === confirmed.liked ? 0 : result.data.liked ? 1 : -1;
        setConfirmed({ liked: result.data.liked, count: confirmed.count + delta });
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={optimistic.liked}
        aria-label={optimistic.liked ? "Unlike this post" : "Like this post"}
        className={cn(
          "inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors hover:bg-accent",
          optimistic.liked ? "text-rose-600" : "text-muted-foreground",
        )}
      >
        <Heart className={cn("size-4", optimistic.liked && "fill-current")} aria-hidden />
        <span>{optimistic.count}</span>
      </button>
      {error ? (
        <span role="alert" className="px-2 text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </span>
  );
}
