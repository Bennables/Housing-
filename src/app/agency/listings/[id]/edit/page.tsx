import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { ListingForm } from "@/components/listings/listing-form";
import { getAgencyForUser, getAgencyListing } from "@/lib/data/agency";
import { listingToFormValues } from "@/lib/listing-form";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditAgencyListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  const agency = viewer ? await getAgencyForUser(viewer.id) : null;
  if (!agency?.verified) redirect("/agency");
  if (!z.uuid().safeParse(id).success) notFound();

  // Only the agency's own listings load here, so another agency's id is a 404.
  const listing = await getAgencyListing(id, agency.id);
  if (!listing) notFound();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Edit listing</h1>
      <ListingForm listingId={listing.id} initial={listingToFormValues(listing)} redirectTo="/agency" />
    </>
  );
}
