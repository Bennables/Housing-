import type { PostView } from "@/lib/types";
import type { Listing } from "@/db/schema";
import { centsToDollarsString } from "@/lib/money";

export type ListingFormValues = {
  name: string;
  type: string;
  category: string;
  level: string;
  state: string;
  summary: string;
  eligibility: string;
  url: string;
  targetAudience: string;
  amountMinDollars: string;
  amountMaxDollars: string;
  frequency: string;
  opensOn: string;
  closesOn: string;
  sourceCheckedOn: string;
};

export const emptyListingForm: ListingFormValues = {
  name: "",
  type: "",
  category: "",
  level: "",
  state: "",
  summary: "",
  eligibility: "",
  url: "",
  targetAudience: "",
  amountMinDollars: "",
  amountMaxDollars: "",
  frequency: "",
  opensOn: "",
  closesOn: "",
  sourceCheckedOn: "",
};

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export function listingToFormValues(l: Listing): ListingFormValues {
  return {
    name: l.name,
    type: l.type,
    category: l.category,
    level: l.level,
    state: l.state ?? "",
    summary: l.summary,
    eligibility: l.eligibility ?? "",
    url: l.url,
    targetAudience: l.targetAudience,
    amountMinDollars: centsToDollarsString(l.amountMinCents),
    amountMaxDollars: centsToDollarsString(l.amountMaxCents),
    frequency: l.frequency ?? "",
    opensOn: day(l.opensAt),
    closesOn: day(l.closesAt),
    sourceCheckedOn: l.sourceCheckedAt ?? "",
  };
}

/** Prefill the listing form from a community post about an unlisted opportunity. */
export function postToFormValues(p: PostView): ListingFormValues {
  return {
    ...emptyListingForm,
    summary: p.body.slice(0, 1000),
    eligibility: p.eligibility ?? "",
    url: p.sourceUrl ?? "",
    targetAudience: p.targetAudience,
    state: p.states[0] ?? "",
    level: p.states.length > 0 ? "state" : "",
    amountMaxDollars: centsToDollarsString(p.benefitCents),
    frequency: p.benefitFrequency ?? "",
  };
}
