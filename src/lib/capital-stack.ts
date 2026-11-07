import type { Frequency } from "./constants";

export type StackItem = {
  id: string;
  kind: "listing" | "post";
  title: string;
  /** The "up to" amount in cents, or null when the amount is unknown. */
  amountCents: number | null;
  frequency: Frequency | null;
};

export type StackSummary = {
  totalCostCents: number;
  firstMortgageCents: number;
  /** Saved one-time funding that counts toward closing the gap. */
  oneTimeCents: number;
  /** total cost - mortgage - saved one-time funding. Negative means overfunded. */
  remainingGapCents: number;
  overfundedCents: number;
  /** Recurring amounts are listed by frequency and never added to the gap or to each other. */
  recurring: { frequency: Frequency; items: StackItem[] }[];
  /** Saved items with no known amount. Shown, never counted. */
  unknown: StackItem[];
  counted: StackItem[];
};

const RECURRING_ORDER: Frequency[] = ["weekly", "monthly", "quarterly", "yearly"];

export function summarizeStack(input: {
  totalCostCents: number;
  firstMortgageCents?: number | null;
  items: StackItem[];
}): StackSummary {
  const totalCostCents = Math.max(0, input.totalCostCents);
  const firstMortgageCents = Math.max(0, input.firstMortgageCents ?? 0);

  const counted: StackItem[] = [];
  const unknown: StackItem[] = [];
  const recurringByFrequency = new Map<Frequency, StackItem[]>();
  let oneTimeCents = 0;

  for (const item of input.items) {
    if (item.amountCents == null || item.frequency == null) {
      unknown.push(item);
    } else if (item.frequency === "one_time") {
      oneTimeCents += item.amountCents;
      counted.push(item);
    } else {
      const list = recurringByFrequency.get(item.frequency) ?? [];
      list.push(item);
      recurringByFrequency.set(item.frequency, list);
    }
  }

  const remainingGapCents = totalCostCents - firstMortgageCents - oneTimeCents;

  return {
    totalCostCents,
    firstMortgageCents,
    oneTimeCents,
    remainingGapCents,
    overfundedCents: Math.max(0, -remainingGapCents),
    recurring: RECURRING_ORDER.filter((f) => recurringByFrequency.has(f)).map((frequency) => ({
      frequency,
      items: recurringByFrequency.get(frequency) ?? [],
    })),
    unknown,
    counted,
  };
}

/** Widths for the stacked bar, as percentages of the larger of cost or funding. */
export function stackBarSegments(summary: StackSummary) {
  const base = Math.max(
    summary.totalCostCents,
    summary.firstMortgageCents + summary.oneTimeCents,
    1,
  );
  const pct = (cents: number) => Math.min(100, Math.max(0, (cents / base) * 100));
  return {
    mortgage: pct(summary.firstMortgageCents),
    saved: pct(summary.oneTimeCents),
    gap: pct(Math.max(0, summary.remainingGapCents)),
  };
}
