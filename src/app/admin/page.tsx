import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { EmptyState } from "@/components/empty-state";
import { SourceBadge } from "@/components/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dismissReports, rejectAgency, verifyAgency } from "@/lib/actions/admin";
import { deletePost } from "@/lib/actions/posts";
import { LABELS } from "@/lib/constants";
import { getAdminListings, getPendingAgencies, getReportedPosts } from "@/lib/data/admin";
import { timeAgo } from "@/lib/format";
import { computeStatus } from "@/lib/listing-status";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const [pending, reported, adminListings] = await Promise.all([
    getPendingAgencies(),
    getReportedPosts(),
    getAdminListings(),
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>

      <section aria-labelledby="pending-title" className="space-y-3">
        <h2 id="pending-title" className="text-lg font-semibold">
          Agencies waiting for review ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <EmptyState title="Nothing to review" />
        ) : (
          <ul className="space-y-3">
            {pending.map((a) => (
              <li key={a.id} className="rounded-xl border bg-card p-4 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {LABELS.level[a.level]} · requested by {a.userName ?? "someone"}
                      {a.userEmail ? ` (${a.userEmail})` : ""}
                    </p>
                    <SourceBadge url={a.website} />
                    <p className="text-xs text-muted-foreground">
                      Check that this website really belongs to the agency before you verify it.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton
                      action={verifyAgency.bind(null, a.id)}
                      label="Verify"
                      variant="default"
                    />
                    <ActionButton
                      action={rejectAgency.bind(null, a.id)}
                      label="Reject"
                      variant="destructive"
                      confirm="Reject this agency? They go back to choosing a role."
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="reports-title" className="space-y-3">
        <h2 id="reports-title" className="text-lg font-semibold">
          Reported posts ({reported.length})
        </h2>
        {reported.length === 0 ? (
          <EmptyState title="No reported posts" />
        ) : (
          <ul className="space-y-3">
            {reported.map((r) => (
              <li key={r.postId} className="rounded-xl border bg-card p-4 shadow-xs">
                <p className="text-sm text-muted-foreground">
                  By {r.authorName ?? "someone"} · {r.reportCount}{" "}
                  {r.reportCount === 1 ? "report" : "reports"} · latest{" "}
                  {timeAgo(new Date(r.latestReportAt).toISOString())}
                </p>
                <p className="mt-1 line-clamp-4 text-sm whitespace-pre-wrap">{r.body}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {r.reasons.map((reason) => (
                    <li key={reason}>
                      <Badge variant="secondary">{reason}</Badge>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/posts/${r.postId}`}>View post</Link>
                  </Button>
                  {!r.sourceUrl ? null : (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/listings/new?fromPost=${r.postId}`}>
                        Make it a listing
                      </Link>
                    </Button>
                  )}
                  <ActionButton action={dismissReports.bind(null, r.postId)} label="Keep post" />
                  <ActionButton
                    action={deletePost.bind(null, r.postId)}
                    label="Delete post"
                    variant="destructive"
                    confirm="Delete this post for everyone?"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="admin-listings-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="admin-listings-title" className="text-lg font-semibold">
            Admin-added listings ({adminListings.length})
          </h2>
          <Button asChild size="sm">
            <Link href="/admin/listings/new">New listing</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          To turn a community post about an unlisted opportunity into a listing, open the post and
          choose &quot;Make it a listing&quot;.
        </p>
        {adminListings.length === 0 ? (
          <EmptyState title="No admin-added listings yet" />
        ) : (
          <ul className="divide-y rounded-xl border bg-card shadow-xs">
            {adminListings.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link href={`/listings/${l.slug}`} className="font-medium hover:underline">
                    {l.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {LABELS.status[computeStatus(l.opensAt, l.closesAt)]} ·{" "}
                    {LABELS.audience[l.targetAudience]}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/listings/${l.id}/edit`}>Edit</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
