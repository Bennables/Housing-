import { VerifiedAgencyBadge } from "@/components/source-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, timeAgo } from "@/lib/format";
import type { CommentView } from "@/lib/types";

export function CommentList({ comments }: { comments: CommentView[] }) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet. Be the first to reply.</p>;
  }
  return (
    <ul className="space-y-4" aria-label="Comments">
      {comments.map((c) => (
        <li key={c.id} className="flex gap-3">
          <Avatar>
            {c.author.image ? (
              <AvatarImage src={c.author.image} alt="" referrerPolicy="no-referrer" />
            ) : null}
            <AvatarFallback>{initials(c.author.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 rounded-lg bg-muted/60 px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-medium">{c.author.name ?? "Someone"}</span>
              {c.author.agencyVerified ? <VerifiedAgencyBadge /> : null}
              <time
                dateTime={c.createdAt}
                suppressHydrationWarning
                className="text-xs text-muted-foreground"
              >
                {timeAgo(c.createdAt)}
              </time>
            </div>
            <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">{c.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
