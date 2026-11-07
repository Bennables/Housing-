import type { ListingStatus } from "./constants";

/**
 * Open, upcoming, closed or rolling is always computed from the dates, never stored.
 * No dates at all means rolling. Only a closing date in the past means closed.
 */
export function computeStatus(
  opensAt: Date | null,
  closesAt: Date | null,
  now: Date = new Date(),
): ListingStatus {
  if (closesAt && closesAt.getTime() <= now.getTime()) return "closed";
  if (opensAt && opensAt.getTime() > now.getTime()) return "upcoming";
  if (!opensAt && !closesAt) return "rolling";
  return "open";
}

export function deadlineText(
  opensAt: Date | null,
  closesAt: Date | null,
  now: Date = new Date(),
): string | null {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(d);
  switch (computeStatus(opensAt, closesAt, now)) {
    case "closed":
      return closesAt ? `Closed ${fmt(closesAt)}` : null;
    case "upcoming":
      return opensAt ? `Opens ${fmt(opensAt)}` : null;
    case "open":
      return closesAt ? `Closes ${fmt(closesAt)}` : "Open now";
    case "rolling":
      return "Rolling applications";
  }
}
