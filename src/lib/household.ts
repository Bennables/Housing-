import type { Frequency } from "./constants";

export type SavedAmount = { amountCents: number | null; frequency: Frequency | null };

/** Convert a recurring amount to a monthly amount. One-time amounts return null. */
export function toMonthlyCents(amountCents: number, frequency: Frequency): number | null {
  switch (frequency) {
    case "weekly":
      return Math.round((amountCents * 52) / 12);
    case "monthly":
      return amountCents;
    case "quarterly":
      return Math.round(amountCents / 3);
    case "yearly":
      return Math.round(amountCents / 12);
    case "one_time":
      return null;
  }
}

export function summarizeHousehold(items: SavedAmount[]) {
  let monthlyCents = 0;
  let oneTimeCents = 0;
  let unknownCount = 0;
  for (const item of items) {
    if (item.amountCents == null || item.frequency == null) {
      unknownCount += 1;
    } else if (item.frequency === "one_time") {
      oneTimeCents += item.amountCents;
    } else {
      monthlyCents += toMonthlyCents(item.amountCents, item.frequency) ?? 0;
    }
  }
  return { monthlyCents, oneTimeCents, unknownCount };
}
