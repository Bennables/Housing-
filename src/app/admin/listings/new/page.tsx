import type { Metadata } from "next";
import { ListingForm } from "@/components/listings/listing-form";
import { getPost } from "@/lib/data/posts";
import { emptyListingForm, postToFormValues } from "@/lib/listing-form";
import { first, type SearchParams } from "@/lib/params";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "New listing" };

export default async function NewAdminListingPage({ searchParams }: { searchParams: SearchParams }) {
  const fromPost = first((await searchParams).fromPost);
  const viewer = await getViewer();
  // Promoting a community post prefills the form from it. The admin checks every fact against the source.
  const post = fromPost ? await getPost(fromPost, viewer) : null;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">New listing</h1>
      {post ? (
        <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          Started from a community post. Check every amount, date and rule against the official source before you
          publish.
        </p>
      ) : null}
      <ListingForm
        listingId={null}
        initial={post ? postToFormValues(post) : emptyListingForm}
        redirectTo="/admin"
      />
    </>
  );
}
