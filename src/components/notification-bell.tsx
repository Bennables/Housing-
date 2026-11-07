import { Bell } from "lucide-react";
import Link from "next/link";
import { getUnreadCount } from "@/lib/data/notifications";

const linkClass =
  "relative inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

/** Bell with an unread badge. One indexed count, so it is cheap on every page. */
export async function NotificationBell({ userId }: { userId: string }) {
  const unread = await getUnreadCount(userId);
  return (
    <Link
      href="/notifications"
      className={linkClass}
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
    >
      <Bell className="size-5" aria-hidden />
      {unread > 0 ? (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-primary-foreground"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

/** Shown while the count loads, so the header does not jump. */
export function NotificationBellFallback() {
  return (
    <Link href="/notifications" className={linkClass} aria-label="Notifications">
      <Bell className="size-5" aria-hidden />
    </Link>
  );
}
