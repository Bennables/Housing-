"use client";

import { Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { promptHref, type ViewerState } from "@/components/viewer-state";
import { reportPost } from "@/lib/actions/posts";
import { REPORT_REASONS } from "@/lib/constants";

export function ReportButton({
  postId,
  viewerState,
}: {
  postId: string;
  viewerState: ViewerState;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function start() {
    const prompt = promptHref(viewerState, `/posts/${postId}`);
    if (prompt) router.push(prompt);
    else setOpen(true);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await reportPost({ postId, reason });
      if (result.ok) {
        setDone(true);
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  if (done) return <span className="px-2 text-sm text-muted-foreground">Thanks, we will take a look.</span>;

  if (!open) {
    return (
      <button
        type="button"
        onClick={start}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
      >
        <Flag className="size-4" aria-hidden />
        Report
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`report-${postId}`}>
        Why are you reporting this post?
      </label>
      <select
        id={`report-${postId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="h-8 rounded-lg border border-input bg-card px-2 text-sm"
      >
        {REPORT_REASONS.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <Button type="button" size="sm" onClick={submit} disabled={pending}>
        {pending ? "Sending…" : "Send report"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
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
