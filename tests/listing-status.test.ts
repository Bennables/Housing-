import { describe, expect, it } from "vitest";
import { computeStatus, deadlineText } from "@/lib/listing-status";

const now = new Date("2026-06-15T12:00:00Z");
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("computeStatus", () => {
  it("is rolling with no dates", () => {
    expect(computeStatus(null, null, now)).toBe("rolling");
  });

  it("is open between the dates or with only one that works", () => {
    expect(computeStatus(day("2026-06-01"), day("2026-07-01"), now)).toBe("open");
    expect(computeStatus(day("2026-06-01"), null, now)).toBe("open");
    expect(computeStatus(null, day("2026-07-01"), now)).toBe("open");
  });

  it("is upcoming before it opens", () => {
    expect(computeStatus(day("2026-07-01"), day("2026-08-01"), now)).toBe("upcoming");
  });

  it("is closed once the closing date has passed", () => {
    expect(computeStatus(day("2026-01-01"), day("2026-06-01"), now)).toBe("closed");
    expect(computeStatus(null, now, now)).toBe("closed");
  });
});

describe("deadlineText", () => {
  it("describes each status in plain words", () => {
    expect(deadlineText(null, null, now)).toBe("Rolling applications");
    expect(deadlineText(day("2026-07-01"), null, now)).toBe("Opens Jul 1, 2026");
    expect(deadlineText(null, day("2026-07-01"), now)).toBe("Closes Jul 1, 2026");
    expect(deadlineText(null, day("2026-06-01"), now)).toBe("Closed Jun 1, 2026");
    expect(deadlineText(day("2026-06-01"), null, now)).toBe("Open now");
  });
});
