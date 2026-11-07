import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ListingForm } from "@/components/listings/listing-form";
import { getAgencyForUser } from "@/lib/data/agency";
import { emptyListingForm } from "@/lib/listing-form";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "New listing" };

export default async function NewAgencyListingPage() {
  const viewer = await getViewer();
  const agency = viewer ? await getAgencyForUser(viewer.id) : null;
  if (!agency?.verified) redirect("/agency");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">New listing</h1>
      <ListingForm listingId={null} initial={emptyListingForm} redirectTo="/agency" />
    </>
  );
}
