import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { DeletePostButton } from "@/components/feed/delete-post-button";
import { LikeButton } from "@/components/feed/like-button";
import { ReportButton } from "@/components/feed/report-button";
import { SaveButton } from "@/components/feed/save-button";
import { ListingCard } from "@/components/listings/listing-card";
import { CommunityLabel, SourceBadge, VerifiedAgencyBadge } from "@/components/source-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ViewerState } from "@/components/viewer-state";
import { initials, timeAgo } from "@/lib/format";
import { formatAmount } from "@/lib/money";
import { stateName } from "@/lib/states";
import type { PostView } from "@/lib/types";

/** Works in both server and client trees: it has no server-only code, only client buttons. */
export function PostCard({
  post,
  viewerState,
  viewerId,
  detail = false,
  onDeleted,
}: {
  post: PostView;
  viewerState: ViewerState;
  viewerId: string | null;
  detail?: boolean;
  onDeleted?: (id: string) => void;
}) {
  const authorName = post.author.name ?? "Someone";
  const isAgencyPost = post.author.agencyVerified;
  const benefit = formatAmount(null, post.benefitCents, post.benefitFrequency);
  const isOwn = viewerId === post.author.id;
  const path = `/posts/${post.id}`;

  return (
    <article
      aria-label={`Post by ${authorName}`}
      className="rounded-xl border bg-card p-4 shadow-xs sm:p-5"
    >
      <header className="flex items-start gap-3">
        <Avatar size="lg">
          {post.author.image ? (
            <AvatarImage src={post.author.image} alt="" referrerPolicy="no-referrer" />
          ) : null}
          <AvatarFallback>{initials(post.author.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{authorName}</span>
            {isAgencyPost ? <VerifiedAgencyBadge /> : null}
            <CommunityLabel agency={isAgencyPost} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isAgencyPost && post.author.agencyName ? `${post.author.agencyName} · ` : ""}
            <Link href={path} className="hover:underline">
              <time dateTime={post.createdAt} suppressHydrationWarning>
                {timeAgo(post.createdAt)}
              </time>
            </Link>
          </p>
        </div>
      </header>

      <p className="mt-3 text-[0.95rem] leading-relaxed break-words whitespace-pre-wrap">
        {post.body}
      </p>

      {post.listing ? (
        <div className="mt-3">
          <ListingCard listing={post.listing} viewerState={viewerState} variant="embedded" />
        </div>
      ) : (
        <div className="mt-3 space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
          {benefit ? (
            <p>
              <span className="font-semibold">Potential benefit: </span>
              <span className="font-semibold text-primary">{benefit}</span>
            </p>
          ) : null}
          {post.eligibility ? (
            <p className="whitespace-pre-line">
              <span className="font-semibold">Who can get it: </span>
              {post.eligibility}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {post.sourceUrl ? <SourceBadge url={post.sourceUrl} /> : null}
            <span className="text-xs text-muted-foreground">Community post, verify at source</span>
          </div>
        </div>
      )}

      {post.listing && post.sourceUrl ? (
        <div className="mt-2">
          <SourceBadge url={post.sourceUrl} />
        </div>
      ) : null}

      {post.states.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="States">
          {post.states.map((code) => (
            <li key={code}>
              <Badge variant="secondary">{stateName(code)}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 border-t pt-2">
        <LikeButton
          postId={post.id}
          liked={post.likedByMe}
          count={post.likeCount}
          viewerState={viewerState}
        />
        {detail ? (
          <span className="inline-flex min-h-8 items-center gap-1.5 px-2 text-sm text-muted-foreground">
            <MessageCircle className="size-4" aria-hidden />
            {post.commentCount}
            <span className="sr-only"> comments</span>
          </span>
        ) : (
          <Link
            href={path}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            <MessageCircle className="size-4" aria-hidden />
            {post.commentCount}
            <span className="sr-only"> comments</span>
          </Link>
        )}
        <SaveButton
          kind="post"
          id={post.id}
          saved={post.savedByMe}
          viewerState={viewerState}
          next={path}
        />
        {!isOwn ? <ReportButton postId={post.id} viewerState={viewerState} /> : null}
        {post.canDelete ? (
          <DeletePostButton
            postId={post.id}
            onDeleted={onDeleted}
            redirectTo={detail ? "/feed" : undefined}
          />
        ) : null}
      </footer>
    </article>
  );
}
