import { ActionButton } from "@/components/action-button";
import { AddSourceForm } from "@/components/stack/add-source-form";
import {
  CapitalStackForm,
  type CapitalStackFormValues,
} from "@/components/stack/capital-stack-form";
import { removeStackSource } from "@/lib/actions/capital-stack";
import {
  affordableSalesRevenueCents,
  bpsToPercentString,
  computeAffordability,
  type Affordability,
} from "@/lib/affordability";
import { stackBarSegments, summarizeStack, type StackItem } from "@/lib/capital-stack";
import { LABELS } from "@/lib/constants";
import { getCapitalStack, getSavedItems } from "@/lib/data/stack";
import { centsToDollarsString, formatMoney } from "@/lib/money";
import type { CapitalStack } from "@/db/schema";

function Row({
  label,
  value,
  strong = false,
  accent = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`font-mono ${strong ? "font-semibold" : "font-medium"} ${accent ? "text-blaze" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function ItemRow({ item }: { item: StackItem }) {
  return (
    <li className="flex items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block truncate">{item.title}</span>
        {item.sourceType ? (
          <span className="block text-xs text-muted-foreground">
            {LABELS.listingType[item.sourceType]}
            {item.kind === "source" ? " · added by you" : ""}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {item.amountCents != null ? (
          <span className="text-muted-foreground">{formatMoney(item.amountCents)}</span>
        ) : null}
        {item.kind === "source" ? (
          <ActionButton
            action={removeStackSource.bind(null, item.id)}
            label="Remove"
            pendingLabel="Removing…"
            variant="ghost"
          />
        ) : null}
      </span>
    </li>
  );
}

function affordabilityFor(stack: CapitalStack): Affordability | null {
  if (
    stack.projectType !== "ownership" ||
    stack.areaMedianIncomeCents == null ||
    stack.amiPercent == null ||
    stack.housingCostPercent == null ||
    stack.interestRateBps == null ||
    stack.downPaymentBps == null
  ) {
    return null;
  }
  return computeAffordability({
    areaMedianIncomeCents: stack.areaMedianIncomeCents,
    amiPercent: stack.amiPercent,
    housingCostPercent: stack.housingCostPercent,
    interestRateBps: stack.interestRateBps,
    downPaymentBps: stack.downPaymentBps,
    otherMonthlyCostsCents: stack.otherMonthlyCostsCents ?? 0,
  });
}

function formValuesFor(stack: CapitalStack): CapitalStackFormValues {
  return {
    projectName: stack.projectName,
    projectType: stack.projectType,
    totalCostDollars: centsToDollarsString(stack.totalCostCents),
    firstMortgageDollars: centsToDollarsString(stack.firstMortgageCents),
    unitCount: stack.unitCount != null ? String(stack.unitCount) : "",
    areaMedianIncomeDollars: centsToDollarsString(stack.areaMedianIncomeCents),
    amiPercent: String(stack.amiPercent ?? 80),
    housingCostPercent: String(stack.housingCostPercent ?? 30),
    interestRatePercent: bpsToPercentString(stack.interestRateBps),
    downPaymentPercent: bpsToPercentString(stack.downPaymentBps),
    otherMonthlyDollars: centsToDollarsString(stack.otherMonthlyCostsCents),
  };
}

/** A builder's project cost against the funding they saved, with the remaining gap. */
export async function CapitalStackSidebar({ userId }: { userId: string }) {
  const [stack, items] = await Promise.all([getCapitalStack(userId), getSavedItems(userId)]);

  return (
    <section aria-labelledby="stack-title" className="rise rounded-2xl border bg-card p-4 sm:p-5">
      <h2 id="stack-title" className="text-xl">
        My Capital Stack
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Potential funding only. Saving a listing does not mean you will get it.
      </p>

      {!stack ? (
        <div className="mt-4">
          <p className="mb-3 text-sm">
            Add your project to see how much funding you have saved against the cost.
            {items.length > 0
              ? ` You have ${items.length} saved ${items.length === 1 ? "item" : "items"}.`
              : ""}
          </p>
          <CapitalStackForm />
        </div>
      ) : (
        <StackBody stack={stack} items={items} />
      )}
    </section>
  );
}

function StackBody({ stack, items }: { stack: CapitalStack; items: StackItem[] }) {
  const affordability = affordabilityFor(stack);
  const units = stack.unitCount ?? 0;
  const salesRevenueCents = affordability
    ? affordableSalesRevenueCents(affordability.maxPriceCents, units)
    : 0;
  const summary = summarizeStack({
    totalCostCents: stack.totalCostCents,
    // An ownership project is repaid from home sales, not a long-term first mortgage.
    firstMortgageCents: affordability ? null : stack.firstMortgageCents,
    salesRevenueCents,
    items,
  });
  const bar = stackBarSegments(summary);
  const overfunded = summary.overfundedCents > 0;

  const hasLists =
    summary.counted.length > 0 || summary.recurring.length > 0 || summary.unknown.length > 0;
  const lists = (
    <>
      {summary.counted.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold">Counted toward the gap</h3>
          <ul className="mt-1 space-y-1.5 text-sm">
            {summary.counted.map((item) => (
              <ItemRow key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </ul>
        </div>
      ) : null}

      {summary.recurring.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold">Recurring support</h3>
          <p className="text-xs text-muted-foreground">
            Listed on its own. It is not added to the gap.
          </p>
          {summary.recurring.map((group) => (
            <div key={group.frequency} className="mt-1.5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {LABELS.frequency[group.frequency]}
              </p>
              <ul className="space-y-1.5 text-sm">
                {group.items.map((item) => (
                  <ItemRow key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {summary.unknown.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold">Amount not known</h3>
          <p className="text-xs text-muted-foreground">Saved, but not counted.</p>
          <ul className="mt-1 space-y-1.5 text-sm">
            {summary.unknown.map((item) => (
              <ItemRow key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="font-medium">{stack.projectName}</p>
        <p className="text-xs text-muted-foreground">{LABELS.projectType[stack.projectType]}</p>
      </div>

      {affordability ? (
        <div className="space-y-1.5 rounded-lg bg-muted/50 p-3">
          <h3 className="text-sm font-semibold">Does it pencil?</h3>
          <p className="text-xs text-muted-foreground">
            A household at {stack.amiPercent}% of AMI earns about{" "}
            {formatMoney(affordability.householdIncomeCents)} a year. At {stack.housingCostPercent}%
            of income, it can spend {formatMoney(affordability.monthlyHousingBudgetCents)} a month
            on housing.
          </p>
          <dl className="space-y-1">
            <Row
              label="Mortgage payment it can afford"
              value={`${formatMoney(affordability.monthlyMortgagePaymentCents)}/mo`}
            />
            <Row
              label="Most it can pay for a home"
              value={formatMoney(affordability.maxPriceCents)}
              strong
            />
          </dl>
          {affordability.maxPriceCents === 0 ? (
            <p className="text-xs text-destructive">
              Taxes, insurance and HOA use up the whole housing budget at this band.
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <div
          role="img"
          aria-label={`Of ${formatMoney(summary.totalCostCents)}: ${
            affordability
              ? `${formatMoney(summary.salesRevenueCents)} affordable sales`
              : `${formatMoney(summary.firstMortgageCents)} first mortgage`
          }, ${formatMoney(summary.oneTimeCents)} saved funding, ${
            overfunded
              ? `overfunded by ${formatMoney(summary.overfundedCents)}`
              : `${formatMoney(summary.remainingGapCents)} still to find`
          }`}
          className="flex h-4 w-full gap-0.5 overflow-hidden rounded-lg bg-blaze/20"
        >
          <div className="bg-foreground" style={{ width: `${bar.mortgage}%` }} />
          <div className="bg-foreground" style={{ width: `${bar.sales}%` }} />
          <div className="bg-primary" style={{ width: `${bar.saved}%` }} />
          <div className="bg-blaze/20" style={{ width: `${bar.gap}%` }} />
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {affordability ? (
            <li className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-foreground" aria-hidden /> Home sales
            </li>
          ) : (
            <li className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-foreground" aria-hidden /> Mortgage
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" aria-hidden /> Saved funding
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full border border-blaze/50 bg-blaze/20" aria-hidden />{" "}
            Gap
          </li>
        </ul>
      </div>

      <dl className="space-y-1.5">
        <Row label="Total cost" value={formatMoney(summary.totalCostCents)} />
        {affordability ? (
          <Row
            label={`Affordable sales (${units} × ${formatMoney(affordability.maxPriceCents)})`}
            value={formatMoney(summary.salesRevenueCents)}
          />
        ) : (
          <Row label="First mortgage" value={formatMoney(summary.firstMortgageCents)} />
        )}
        <Row label="Saved one-time funding" value={formatMoney(summary.oneTimeCents)} />
        <div className="border-t pt-1.5">
          {overfunded ? (
            <Row
              label="Potentially overfunded by"
              value={formatMoney(summary.overfundedCents)}
              strong
            />
          ) : (
            <>
              <Row
                label="Remaining gap"
                value={formatMoney(summary.remainingGapCents)}
                strong
                accent
              />
              {affordability && units > 0 ? (
                <Row
                  label="Gap per home"
                  value={formatMoney(Math.ceil(summary.remainingGapCents / units))}
                />
              ) : null}
            </>
          )}
        </div>
      </dl>

      {hasLists ? (
        <>
          <div className="hidden space-y-4 lg:block">{lists}</div>
          <details className="rounded-lg border px-3 py-2 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium">Saved items</summary>
            <div className="mt-3 space-y-4">{lists}</div>
          </details>
        </>
      ) : null}

      <details className="rounded-lg border px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium">Add a funding source</summary>
        <p className="mt-2 text-xs text-muted-foreground">
          For money that is not a listing here: a lender, an employer match, a donor pledge or
          resale revenue.
        </p>
        <div className="mt-3">
          <AddSourceForm />
        </div>
      </details>

      <details className="rounded-lg border px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium">Edit project</summary>
        <div className="mt-3">
          <CapitalStackForm initial={formValuesFor(stack)} />
        </div>
      </details>
    </div>
  );
}
