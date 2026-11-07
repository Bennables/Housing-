import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { EmptyState } from "@/components/empty-state";
import { VerifiedAgencyBadge } from "@/components/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LABELS } from "@/lib/constants";
import { closeListing } from "@/lib/actions/listings";
import { getAgencyForUser, getAgencyListings } from "@/lib/data/agency";
import { computeStatus, deadlineText } from "@/lib/listing-status";
import { formatAmount } from "@/lib/money";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "My agency" };

export default async function AgencyPage() {
  const viewer = await getViewer();
  const agency = viewer ? await getAgencyForUser(viewer.id) : null;

  if (!agency) {
    return (
      <EmptyState title="You do not have an agency yet">
        <Link href="/onboarding/agency" className="font-medium text-primary underline-offset-4 hover:underline">
          Request agency verification
        </Link>
      </EmptyState>
    );
  }

  const rows = agency.verified ? await getAgencyListings(agency.id) : [];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{agency.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{LABELS.level[agency.level]}</span>
            {agency.verified ? <VerifiedAgencyBadge /> : <Badge variant="outline">Waiting for verification</Badge>}
          </div>
        </div>
        {agency.verified ? (
          <Button asChild>
            <Link href="/agency/listings/new">New listing</Link>
          </Button>
        ) : null}
      </div>

      {!agency.verified ? (
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <p className="font-medium">An admin is reviewing your agency.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You can create and publish listings as soon as your agency is verified. We check the website you gave us (
            {agency.website}) to confirm who you are.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No listings yet">Create your first listing so people can find your program.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ listing, postCount, saveCount }) => {
            const status = computeStatus(listing.opensAt, listing.closesAt);
            const amount = formatAmount(listing.amountMinCents, listing.amountMaxCents, listing.frequency);
            return (
              <li key={listing.id} className="rounded-xl border bg-card p-4 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <Link href={`/listings/${listing.slug}`} className="font-semibold hover:underline">
                      {listing.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{LABELS.status[status]}</Badge>
                      {amount ? <span>{amount}</span> : null}
                      <span>{deadlineText(listing.opensAt, listing.closesAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {postCount} {postCount === 1 ? "post shares" : "posts share"} this · {saveCount}{" "}
                      {saveCount === 1 ? "person saved" : "people saved"} it
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/agency/listings/${listing.id}/edit`}>Edit</Link>
                    </Button>
                    {status !== "closed" ? (
                      <ActionButton
                        action={closeListing.bind(null, listing.id)}
                        label="Close"
                        pendingLabel="Closing…"
                        confirm="Close this listing? It will move to past listings."
                      />
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
