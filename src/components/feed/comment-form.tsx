"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { promptHref, type ViewerState } from "@/components/viewer-state";
import { addComment } from "@/lib/actions/comments";

export function CommentForm({ postId, viewerState }: { postId: string; viewerState: ViewerState }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const prompt = promptHref(viewerState, `/posts/${postId}`);

  if (prompt) {
    return (
      <p className="rounded-lg border border-dashed bg-card px-4 py-3 text-sm text-muted-foreground">
        <a href={prompt} className="font-medium text-primary underline-offset-4 hover:underline">
          {viewerState === "anon" ? "Sign in" : "Choose how you will use the site"}
        </a>{" "}
        to join the conversation.
      </p>
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addComment({ postId, body });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Label htmlFor="comment-body">Add a comment</Label>
      <Textarea
        id="comment-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={1000}
        required
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || body.trim() === ""}>
          {pending ? "Sending…" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
