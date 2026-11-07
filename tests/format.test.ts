import { describe, expect, it } from "vitest";
import { initials, timeAgo } from "@/lib/format";

describe("initials", () => {
  it("uses the first and last word", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("Ada")).toBe("A");
    expect(initials("jean claude van damme")).toBe("JD");
  });

  it("ignores punctuation, so a name like 'Demo agency (verified)' is not '(' ", () => {
    expect(initials("Demo agency (verified)")).toBe("DV");
    expect(initials("(verified)")).toBe("V");
  });

  it("falls back to a question mark", () => {
    expect(initials(null)).toBe("?");
    expect(initials("   ")).toBe("?");
    expect(initials("()")).toBe("?");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it("says just now under a minute", () => {
    expect(timeAgo(ago(20_000), now)).toBe("just now");
  });

  it("uses the largest whole unit", () => {
    expect(timeAgo(ago(5 * 60_000), now)).toBe("5 minutes ago");
    expect(timeAgo(ago(3 * 3600_000), now)).toBe("3 hours ago");
    expect(timeAgo(ago(2 * 24 * 3600_000), now)).toBe("2 days ago");
  });
});
