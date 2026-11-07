"use client";

import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { promptHref, type ViewerState } from "@/components/viewer-state";
import { toggleSaveListing, toggleSavePost } from "@/lib/actions/saves";
import { cn } from "@/lib/utils";

export function SaveButton({
  kind,
  id,
  saved,
  viewerState,
  next,
  className,
}: {
  kind: "listing" | "post";
  id: string;
  saved: boolean;
  viewerState: ViewerState;
  next: string;
  /** Replaces the default look so the button can match its neighbours. */
  className?: string;
}) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    const prompt = promptHref(viewerState, next);
    if (prompt) {
      router.push(prompt);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = kind === "listing" ? await toggleSaveListing(id) : await toggleSavePost(id);
      if (result.ok) setIsSaved(result.data.saved);
      else setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={isSaved}
        className={cn(
          className ??
            "inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60",
          isSaved ? "text-primary" : className ? undefined : "text-muted-foreground",
        )}
      >
        <Bookmark className={cn("size-4", isSaved && "fill-current")} aria-hidden />
        {isSaved ? "Saved" : "Save"}
      </button>
      {error ? (
        <span role="alert" className="px-2 text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </span>
  );
}
