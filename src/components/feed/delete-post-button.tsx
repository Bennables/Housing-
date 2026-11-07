"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deletePost } from "@/lib/actions/posts";

export function DeletePostButton({
  postId,
  onDeleted,
  redirectTo,
}: {
  postId: string;
  onDeleted?: (id: string) => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await deletePost(postId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDeleted?.(postId);
      if (redirectTo) router.push(redirectTo);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" aria-hidden />
        Delete
      </button>
    );
  }

  return (
    <span
      className="inline-flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Confirm delete"
    >
      <span className="text-sm text-muted-foreground">Delete this post?</span>
      <Button type="button" variant="destructive" size="sm" onClick={confirm} disabled={pending}>
        {pending ? "Deleting…" : "Yes, delete"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Cancel
      </Button>
      {error ? (
        <span role="alert" className="w-full text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </span>
  );
}
