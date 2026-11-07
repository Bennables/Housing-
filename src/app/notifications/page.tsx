import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionButton } from "@/components/action-button";
import { EmptyState } from "@/components/empty-state";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import {
  getClosingSoon,
  getEmailSettings,
  getNotifications,
  type NotificationView,
} from "@/lib/data/notifications";
import { isEmailConfigured } from "@/lib/email";
import { formatDate, timeAgo } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

function describe(n: NotificationView): { text: string; href: string } {
  switch (n.type) {
    case "new_listing":
      return {
        text: `New program for you: ${n.listingName ?? "a listing"}`,
        href: n.listingSlug ? `/listings/${n.listingSlug}` : "/listings",
      };
    case "comment":
      return {
        text: `${n.actorName ?? "Someone"} commented on your post`,
        href: n.postId ? `/posts/${n.postId}` : "/feed",
      };
    case "like":
      return {
        text: `${n.actorName ?? "Someone"} liked your post`,
        href: n.postId ? `/posts/${n.postId}` : "/feed",
      };
  }
}

export default async function NotificationsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/notifications");
  if (viewer.role === "unassigned") redirect("/onboarding");

  const canEmail =
    (viewer.role === "household" || viewer.role === "builder") && isEmailConfigured();
  const [items, closingSoon, emailSettings] = await Promise.all([
    getNotifications(viewer.id),
    getClosingSoon(viewer.id),
    canEmail ? getEmailSettings(viewer.id) : null,
  ]);
  const unread = items.filter((n) => !n.read).length;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {unread > 0 ? (
          <ActionButton
            action={markAllNotificationsRead}
            label="Mark all as read"
            pendingLabel="Marking…"
          />
        ) : null}
      </div>

      {closingSoon.length > 0 ? (
        <section aria-labelledby="closing-soon" className="space-y-2">
          <h2 id="closing-soon" className="text-sm font-semibold">
            Closing soon
          </h2>
          <ul className="divide-y rounded-xl border bg-card shadow-xs">
            {closingSoon.map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/listings/${l.slug}`}
                  className="flex flex-col gap-0.5 px-4 py-3 hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{l.name}</span>
                  <span className="text-sm text-muted-foreground">
                    You saved this. Closes {formatDate(l.closesAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="all-notifications" className="space-y-2">
        <h2 id="all-notifications" className="sr-only">
          All notifications
        </h2>
        {items.length === 0 ? (
          <EmptyState title="Nothing new yet">
            When a new program is added for you, or someone responds to your post, it shows up here.
          </EmptyState>
        ) : (
          <ul className="divide-y rounded-xl border bg-card shadow-xs">
            {items.map((n) => {
              const { text, href } = describe(n);
              return (
                <li key={n.id}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-accent/50",
                      !n.read && "bg-accent/30",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block", !n.read && "font-medium")}>
                        {text}
                        {!n.read ? <span className="sr-only"> (unread)</span> : null}
                      </span>
                      {n.postSnippet ? (
                        <span className="block truncate text-sm text-muted-foreground">
                          {n.postSnippet}
                        </span>
                      ) : null}
                    </span>
                    <time dateTime={n.createdAt} className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {canEmail && emailSettings && !emailSettings.enabled ? (
        <p className="text-sm text-muted-foreground">
          Want new programs by email?{" "}
          <Link href="/profile#email-alerts" className="font-medium text-primary underline">
            Turn on email alerts
          </Link>
          .
        </p>
      ) : null}
    </main>
  );
}
