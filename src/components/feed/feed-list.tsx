"use client";

import { useState, useTransition } from "react";
import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import type { ViewerState } from "@/components/viewer-state";
import { loadMorePosts } from "@/lib/actions/feed";
import type { PostView } from "@/lib/types";

/** The first page comes from the server. "Load more" appends further pages with a Server Action. */
export function FeedList({
  initialPosts,
  initialCursor,
  viewerState,
  viewerId,
  audience,
  state,
}: {
  initialPosts: PostView[];
  initialCursor: string | null;
  viewerState: ViewerState;
  viewerId: string | null;
  audience: "builder" | "household";
  state?: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    if (!cursor) return;
    setError(null);
    startTransition(async () => {
      const result = await loadMorePosts({ cursor, audience, state });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setPosts((current) => {
        // Guard against a post appearing twice if new posts shifted the pages.
        const seen = new Set(current.map((p) => p.id));
        return [...current, ...result.posts.filter((p) => !seen.has(p.id))];
      });
      setCursor(result.nextCursor);
    });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard
              post={post}
              viewerState={viewerState}
              viewerId={viewerId}
              onDeleted={(id) => setPosts((current) => current.filter((p) => p.id !== id))}
            />
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {cursor ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={loadMore} disabled={pending}>
            {pending ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : posts.length > 0 ? (
        <p className="text-center text-sm text-muted-foreground">You are all caught up.</p>
      ) : null}
    </div>
  );
}
