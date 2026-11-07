import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/listings/listing-card";
import { Disclaimer } from "@/components/disclaimer";
import { viewerStateOf } from "@/components/viewer-state";
import { timeAgo } from "@/lib/format";
import { getListingBySlug } from "@/lib/data/listings";
import { getPostsForListing } from "@/lib/data/posts";
import { getViewer } from "@/lib/session";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListingBySlug((await params).slug, null);
  return { title: listing?.name ?? "Listing" };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const viewer = await getViewer();
  const listing = await getListingBySlug(slug, viewer?.id ?? null);
  if (!listing) notFound();
  const sharing = await getPostsForListing(listing.id, viewer);

  return (
    <div className="space-y-5">
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All listings
      </Link>

      <ListingCard listing={listing} viewerState={viewerStateOf(viewer)} variant="detail" />
      <Disclaimer />

      <section aria-labelledby="shared-title" className="space-y-3">
        <h2 id="shared-title" className="font-semibold">
          What people are saying
        </h2>
        {sharing.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one has posted about this yet.{" "}
            <Link
              href={`/feed?share=${listing.slug}#composer`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Share your experience
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {sharing.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/posts/${post.id}`}
                  className="block rounded-lg border bg-card p-3 hover:bg-accent/40"
                >
                  <p className="text-sm font-medium">
                    {post.author.name ?? "Someone"}{" "}
                    <span className="font-normal text-muted-foreground">
                      ·{" "}
                      <time dateTime={post.createdAt} suppressHydrationWarning>
                        {timeAgo(post.createdAt)}
                      </time>
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm">{post.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
