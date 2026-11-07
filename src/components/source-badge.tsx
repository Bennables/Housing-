import { BadgeCheck, ExternalLink } from "lucide-react";

export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Links to the official page. Every listing and post shows one. */
export function SourceBadge({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1 rounded-md border bg-card px-2 py-0.5 text-xs font-medium text-foreground hover:bg-accent"
    >
      <ExternalLink className="size-3 shrink-0" aria-hidden />
      <span className="truncate">Source: {sourceHost(url)}</span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function VerifiedAgencyBadge({ label = "Verified agency" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
      <BadgeCheck className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

export function CommunityLabel({ agency = false }: { agency?: boolean }) {
  return (
    <span className="inline-flex items-center rounded-md border border-dashed px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {agency ? "Agency post" : "Community post"}
    </span>
  );
}
