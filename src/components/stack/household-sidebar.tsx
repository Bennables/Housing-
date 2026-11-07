import { summarizeHousehold } from "@/lib/household";
import { getSavedItems } from "@/lib/data/stack";
import { formatMoney } from "@/lib/money";

/** An estimate of monthly money freed up for rent by the programs a household saved. */
export async function HouseholdSidebar({ userId }: { userId: string }) {
  const items = await getSavedItems(userId);
  const summary = summarizeHousehold(items);
  const hasAny = items.length > 0;

  return (
    <section aria-labelledby="household-title" className="rounded-xl border bg-card p-4 shadow-xs">
      <h2 id="household-title" className="font-semibold">
        Money freed up for rent
      </h2>
      {!hasAny ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Save programs to see an estimate of how much a month they could free up for rent.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <p>
            <span className="text-sm text-muted-foreground">Up to </span>
            <span className="text-2xl font-semibold text-primary">
              {formatMoney(summary.monthlyCents)}
            </span>
            <span className="text-sm text-muted-foreground"> a month</span>
          </p>
          {summary.oneTimeCents > 0 ? (
            <p className="text-sm">
              Plus {formatMoney(summary.oneTimeCents)}{" "}
              <span className="text-muted-foreground">one time</span>
            </p>
          ) : null}
          {summary.unknownCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {summary.unknownCount} saved {summary.unknownCount === 1 ? "item has" : "items have"}{" "}
              no known amount, so {summary.unknownCount === 1 ? "it is" : "they are"} not counted.
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            An estimate that uses the highest amount of each program you saved. Weekly amounts count
            as 52 weeks a year, then divide by 12. What you actually get depends on whether you
            qualify.
          </p>
        </div>
      )}
    </section>
  );
}
