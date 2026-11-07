import { CalendarClock, Share2 } from "lucide-react";
import Link from "next/link";
import { SaveButton } from "@/components/feed/save-button";
import { SourceBadge, VerifiedAgencyBadge, sourceHost } from "@/components/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ViewerState } from "@/components/viewer-state";
import { LABELS, type ListingStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { computeStatus, deadlineText } from "@/lib/listing-status";
import { formatAmount } from "@/lib/money";
import { stateName } from "@/lib/states";
import type { ListingView } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ListingStatus, string> = {
  open: "bg-emerald-100 text-emerald-900",
  rolling: "bg-sky-100 text-sky-900",
  upcoming: "bg-amber-100 text-amber-900",
  closed: "bg-muted text-muted-foreground",
};

export function ListingCard({
  listing,
  viewerState,
  variant = "full",
}: {
  listing: ListingView;
  viewerState: ViewerState;
  /** "embedded" is the compact card shown inside a post. "detail" shows everything. */
  variant?: "full" | "embedded" | "detail";
}) {
  const opensAt = listing.opensAt ? new Date(listing.opensAt) : null;
  const closesAt = listing.closesAt ? new Date(listing.closesAt) : null;
  const status = computeStatus(opensAt, closesAt);
  const amount = formatAmount(listing.amountMinCents, listing.amountMaxCents, listing.frequency);
  const deadline = deadlineText(opensAt, closesAt);
  const embedded = variant === "embedded";
  const detail = variant === "detail";
  const href = `/listings/${listing.slug}`;

  return (
    <article
      aria-label={`Listing: ${listing.name}`}
      className={cn("rounded-xl border bg-card p-4", embedded ? "bg-muted/40" : "shadow-xs")}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className={cn("border-transparent", STATUS_STYLE[status])}>
          {LABELS.status[status]}
        </Badge>
        <Badge variant="outline">{LABELS.listingType[listing.type]}</Badge>
        <Badge variant="outline">{LABELS.category[listing.category]}</Badge>
        <Badge variant="outline">
          {LABELS.level[listing.level]}
          {listing.state ? ` · ${stateName(listing.state)}` : ""}
        </Badge>
        <Badge variant="outline">For {LABELS.audience[listing.targetAudience].toLowerCase()}</Badge>
      </div>

      <h3 className={cn("mt-3 leading-snug font-semibold", detail ? "text-2xl" : "text-lg")}>
        {detail ? (
          listing.name
        ) : (
          <Link href={href} className="hover:underline">
            {listing.name}
          </Link>
        )}
      </h3>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>{listing.agencyName ?? sourceHost(listing.url)}</span>
        <VerifiedAgencyBadge label={listing.agencyName ? "Verified agency" : "Verified by admin"} />
      </div>

      <p className={cn("mt-3 text-sm leading-relaxed", !detail && "line-clamp-3")}>
        {listing.summary}
      </p>

      {amount ? <p className="mt-3 text-base font-semibold text-primary">{amount}</p> : null}

      {deadline ? (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarClock className="size-4" aria-hidden />
          {deadline}
        </p>
      ) : null}

      {detail && listing.eligibility ? (
        <section className="mt-4">
          <h4 className="text-sm font-semibold">Who can get it</h4>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{listing.eligibility}</p>
        </section>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <SourceBadge url={listing.url} />
        {listing.sourceCheckedAt ? (
          <span className="text-xs text-muted-foreground">
            Last verified {formatDate(listing.sourceCheckedAt)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Check the source for the latest details
          </span>
        )}
      </div>

      {!embedded ? (
        <div className="mt-3 flex flex-wrap items-center gap-1 border-t pt-3">
          <SaveButton
            kind="listing"
            id={listing.id}
            saved={listing.savedByMe}
            viewerState={viewerState}
            next={href}
          />
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href={`/feed?share=${listing.slug}#composer`}>
              <Share2 aria-hidden />
              Share
            </Link>
          </Button>
          {!detail ? (
            <Button asChild variant="ghost" size="sm" className="ml-auto">
              <Link href={href}>Details</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
