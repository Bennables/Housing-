import { CapitalStackForm } from "@/components/stack/capital-stack-form";
import { stackBarSegments, summarizeStack } from "@/lib/capital-stack";
import { LABELS } from "@/lib/constants";
import { getCapitalStack, getSavedItems } from "@/lib/data/stack";
import { centsToDollarsString, formatMoney } from "@/lib/money";

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

function StackBody({
  stack,
  items,
}: {
  stack: NonNullable<Awaited<ReturnType<typeof getCapitalStack>>>;
  items: Awaited<ReturnType<typeof getSavedItems>>;
}) {
  const summary = summarizeStack({
    totalCostCents: stack.totalCostCents,
    firstMortgageCents: stack.firstMortgageCents,
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
          <ul className="mt-1 space-y-1 text-sm">
            {summary.counted.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">{item.title}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatMoney(item.amountCents ?? 0)}
                </span>
              </li>
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
              <ul className="space-y-1 text-sm">
                {group.items.map((item) => (
                  <li key={`${item.kind}-${item.id}`} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{item.title}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatMoney(item.amountCents ?? 0)}
                    </span>
                  </li>
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
          <ul className="mt-1 space-y-1 text-sm">
            {summary.unknown.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="truncate">
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="mt-4 space-y-4">
      <p className="font-medium">{stack.projectName}</p>

      <div>
        <div
          role="img"
          aria-label={`Of ${formatMoney(summary.totalCostCents)}: ${formatMoney(summary.firstMortgageCents)} first mortgage, ${formatMoney(summary.oneTimeCents)} saved funding, ${
            overfunded
              ? `overfunded by ${formatMoney(summary.overfundedCents)}`
              : `${formatMoney(summary.remainingGapCents)} still to find`
          }`}
          className="flex h-4 w-full gap-0.5 overflow-hidden rounded-lg bg-blaze/20"
        >
          <div className="bg-foreground" style={{ width: `${bar.mortgage}%` }} />
          <div className="bg-primary" style={{ width: `${bar.saved}%` }} />
          <div className="bg-blaze/20" style={{ width: `${bar.gap}%` }} />
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-foreground" aria-hidden /> Mortgage
          </li>
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
        <Row label="First mortgage" value={formatMoney(summary.firstMortgageCents)} />
        <Row label="Saved one-time funding" value={formatMoney(summary.oneTimeCents)} />
        <div className="border-t pt-1.5">
          {overfunded ? (
            <Row
              label="Potentially overfunded by"
              value={formatMoney(summary.overfundedCents)}
              strong
            />
          ) : (
            <Row
              label="Remaining gap"
              value={formatMoney(summary.remainingGapCents)}
              strong
              accent
            />
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
        <summary className="cursor-pointer text-sm font-medium">Edit project</summary>
        <div className="mt-3">
          <CapitalStackForm
            initial={{
              projectName: stack.projectName,
              totalCostDollars: centsToDollarsString(stack.totalCostCents),
              firstMortgageDollars: centsToDollarsString(stack.firstMortgageCents),
            }}
          />
        </div>
      </details>
    </div>
  );
}
