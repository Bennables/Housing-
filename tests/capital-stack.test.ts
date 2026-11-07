import { describe, expect, it } from "vitest";
import { stackBarSegments, summarizeStack, type StackItem } from "@/lib/capital-stack";

const item = (
  id: string,
  amountCents: number | null,
  frequency: StackItem["frequency"],
): StackItem => ({
  id,
  kind: "listing",
  title: id,
  amountCents,
  frequency,
});

describe("summarizeStack", () => {
  it("subtracts the mortgage and saved one-time funding from the cost", () => {
    const s = summarizeStack({
      totalCostCents: 1_000_000_00,
      firstMortgageCents: 400_000_00,
      items: [item("grant", 100_000_00, "one_time"), item("loan", 50_000_00, "one_time")],
    });
    expect(s.oneTimeCents).toBe(150_000_00);
    expect(s.remainingGapCents).toBe(450_000_00);
    expect(s.overfundedCents).toBe(0);
  });

  it("never adds recurring amounts to the gap or to each other", () => {
    const s = summarizeStack({
      totalCostCents: 100_000_00,
      items: [
        item("a", 500_00, "monthly"),
        item("b", 6_000_00, "yearly"),
        item("c", 20_00, "weekly"),
      ],
    });
    expect(s.remainingGapCents).toBe(100_000_00);
    expect(s.recurring.map((r) => r.frequency)).toEqual(["weekly", "monthly", "yearly"]);
    expect(s.recurring.flatMap((r) => r.items).length).toBe(3);
  });

  it("shows unknown amounts but does not count them", () => {
    const s = summarizeStack({
      totalCostCents: 100_00,
      items: [
        item("mystery", null, null),
        item("half", 5_00, null),
        item("known", 40_00, "one_time"),
      ],
    });
    expect(s.unknown.map((i) => i.id)).toEqual(["mystery", "half"]);
    expect(s.remainingGapCents).toBe(60_00);
  });

  it("reports overfunding when the gap goes negative", () => {
    const s = summarizeStack({
      totalCostCents: 100_00,
      firstMortgageCents: 60_00,
      items: [item("big", 80_00, "one_time")],
    });
    expect(s.remainingGapCents).toBe(-40_00);
    expect(s.overfundedCents).toBe(40_00);
  });

  it("treats a missing mortgage as zero", () => {
    const s = summarizeStack({ totalCostCents: 50_00, items: [] });
    expect(s.remainingGapCents).toBe(50_00);
  });
});

describe("stackBarSegments", () => {
  it("keeps every segment within 0 to 100 percent", () => {
    const s = summarizeStack({
      totalCostCents: 100_00,
      firstMortgageCents: 25_00,
      items: [item("a", 25_00, "one_time")],
    });
    const bar = stackBarSegments(s);
    expect(bar).toEqual({ mortgage: 25, sales: 0, saved: 25, gap: 50 });
  });

  it("scales to the funding when overfunded", () => {
    const s = summarizeStack({ totalCostCents: 100_00, items: [item("a", 200_00, "one_time")] });
    const bar = stackBarSegments(s);
    expect(bar.saved).toBe(100);
    expect(bar.gap).toBe(0);
  });
});
