import type { Frequency } from "./constants";

export const MAX_CENTS = 100_000_000_000_00; // $100 billion, far above any real project

/**
 * Parses what a person typed into a dollar field ("1,250", "$40000.50") into integer cents.
 * Returns null for an empty field and "invalid" for anything that is not a positive amount.
 * Money is stored as integer cents everywhere. This is the only place dollars become cents.
 */
export function parseDollarsToCents(input: string | null | undefined): number | null | "invalid" {
  const raw = (input ?? "").trim();
  if (raw === "") return null;
  const text = raw.replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return "invalid";
  const cents = Math.round(Number(text) * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_CENTS) return "invalid";
  return cents;
}

export function centsToDollarsString(cents: number | null | undefined): string {
  if (cents == null) return "";
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
}

export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  const whole = Number.isInteger(dollars);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

const SUFFIX: Record<Frequency, string> = {
  one_time: " one-time",
  weekly: "/week",
  monthly: "/month",
  quarterly: "/quarter",
  yearly: "/year",
};

/**
 * "Up to $292/month", "$40,000 one-time", "$100 to $500/month".
 * Returns null when there is nothing to show. An amount is never shown without its frequency.
 */
export function formatAmount(
  minCents: number | null | undefined,
  maxCents: number | null | undefined,
  frequency: Frequency | null | undefined,
): string | null {
  if (!frequency) return null;
  const suffix = SUFFIX[frequency];
  const hasMin = minCents != null;
  const hasMax = maxCents != null;
  if (hasMin && hasMax) {
    if (minCents === maxCents) return `${formatMoney(maxCents)}${suffix}`;
    if (minCents === 0) return `Up to ${formatMoney(maxCents)}${suffix}`;
    return `${formatMoney(minCents)} to ${formatMoney(maxCents)}${suffix}`;
  }
  if (hasMax) return `Up to ${formatMoney(maxCents)}${suffix}`;
  if (hasMin) return `From ${formatMoney(minCents)}${suffix}`;
  return null;
}

/** The "up to" figure used when totaling potential funding. Null when the amount is unknown. */
export function potentialCents(
  minCents: number | null | undefined,
  maxCents: number | null | undefined,
): number | null {
  return maxCents ?? minCents ?? null;
}
