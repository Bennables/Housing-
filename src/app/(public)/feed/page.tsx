import type { Metadata } from "next";
import Link from "next/link";
import { AudienceToggle } from "@/components/audience-toggle";
import { EmptyState } from "@/components/empty-state";
import { Composer } from "@/components/feed/composer";
import { FeedList } from "@/components/feed/feed-list";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { viewerStateOf } from "@/components/viewer-state";
import { hasAudienceToggle, resolveAudience } from "@/lib/audience";
import { getListingBySlug } from "@/lib/data/listings";
import { getFeedPage } from "@/lib/data/posts";
import { first, type SearchParams } from "@/lib/params";
import { getViewer } from "@/lib/session";
import { US_STATES, isStateCode } from "@/lib/states";

export const metadata: Metadata = { title: "Feed" };

export default async function FeedPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const state = first(sp.state);
  const validState = state && isStateCode(state) ? state : undefined;
  const audience = resolveAudience(viewer?.role ?? null, first(sp.audience));
  const viewerState = viewerStateOf(viewer);
  const shareSlug = first(sp.share);

  const [feed, shared] = await Promise.all([
    getFeedPage({ viewer, audience, state: validState }),
    shareSlug ? getListingBySlug(shareSlug, viewer?.id ?? null) : Promise.resolve(null),
  ]);

  const toggle = hasAudienceToggle(viewer?.role ?? null);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Community feed</h1>
        <p className="text-sm text-muted-foreground">
          People sharing programs and funding they found. Posts are from the community, not
          official. Check every source.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {toggle ? (
          <AudienceToggle basePath="/feed" current={audience} params={{ state: validState }} />
        ) : null}
        <form method="get" action="/feed" className="flex items-end gap-2">
          {toggle ? <input type="hidden" name="audience" value={audience} /> : null}
          <div className="space-y-1">
            <label htmlFor="feed-state" className="block text-xs font-medium text-muted-foreground">
              State
            </label>
            <NativeSelect
              id="feed-state"
              name="state"
              defaultValue={validState ?? ""}
              className="w-44"
            >
              <option value="">All states</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button type="submit" variant="outline" size="lg">
            Filter
          </Button>
          {validState ? (
            <Button asChild variant="ghost" size="lg">
              <Link href={toggle ? `/feed?audience=${audience}` : "/feed"}>Clear</Link>
            </Button>
          ) : null}
        </form>
      </div>

      {viewerState === "ready" ? (
        <Composer
          key={shared?.id ?? "composer"}
          initialListing={shared ? { id: shared.id, name: shared.name } : null}
        />
      ) : (
        <SignInPrompt state={viewerState} next="/feed">
          Sign in to share an opportunity, like, comment and save.
        </SignInPrompt>
      )}

      {feed.posts.length === 0 ? (
        <EmptyState title={validState ? "No posts for this state yet" : "No posts yet"}>
          {viewerState === "ready"
            ? "Be the first to share a program or funding opportunity."
            : "Sign in to be the first to share a program or funding opportunity."}
        </EmptyState>
      ) : (
        <FeedList
          // A new first post means the page was refreshed, so start the list fresh.
          key={feed.posts[0]?.id}
          initialPosts={feed.posts}
          initialCursor={feed.nextCursor}
          viewerState={viewerState}
          viewerId={viewer?.id ?? null}
          audience={audience}
          state={validState}
        />
      )}
    </div>
  );
}
