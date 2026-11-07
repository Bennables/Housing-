import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ListingForm } from "@/components/listings/listing-form";
import { getAnyListing } from "@/lib/data/admin";
import { listingToFormValues } from "@/lib/listing-form";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditAdminListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const listing = await getAnyListing(id);
  if (!listing) notFound();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Edit listing</h1>
      <ListingForm listingId={listing.id} initial={listingToFormValues(listing)} redirectTo="/admin" />
    </>
  );
}
