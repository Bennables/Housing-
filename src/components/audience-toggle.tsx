import Link from "next/link";
import type { BrowseAudience } from "@/lib/audience";
import { cn } from "@/lib/utils";

/** Builder / Household switch for signed-out people and agencies. It lives in the URL. */
export function AudienceToggle({
  basePath,
  current,
  params,
}: {
  basePath: string;
  current: BrowseAudience;
  params: Record<string, string | undefined>;
}) {
  const href = (audience: BrowseAudience) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "audience" && key !== "cursor") query.set(key, value);
    }
    query.set("audience", audience);
    return `${basePath}?${query.toString()}`;
  };

  return (
    <nav aria-label="Show content for" className="inline-flex rounded-lg border bg-card p-0.5 text-sm">
      {(["household", "builder"] as const).map((audience) => (
        <Link
          key={audience}
          href={href(audience)}
          aria-current={current === audience ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 font-medium capitalize transition-colors",
            current === audience ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {audience}
        </Link>
      ))}
    </nav>
  );
}
