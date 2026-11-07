import { describe, expect, it } from "vitest";
import { buildInterestProfile, buildSmsText, postTags, topTags } from "@/lib/interests";

const listing = {
  type: "grant" as const,
  category: "adu" as const,
  level: "state" as const,
  state: "CA",
  frequency: "one_time" as const,
};

describe("postTags", () => {
  it("takes tags from the shared listing and the post", () => {
    expect(
      postTags({
        targetAudience: "builder",
        states: ["CA", "NV"],
        benefitFrequency: null,
        listing,
      }),
    ).toEqual([
      "audience:builder",
      "category:adu",
      "frequency:one_time",
      "level:state",
      "state:CA",
      "state:NV",
      "type:grant",
    ]);
  });

  it("uses the benefit frequency only for unlisted posts", () => {
    expect(
      postTags({
        targetAudience: "household",
        states: [],
        benefitFrequency: "monthly",
        listing: null,
      }),
    ).toEqual(["audience:household", "frequency:monthly"]);
  });
});

describe("buildInterestProfile", () => {
  it("weights tags by view count", () => {
    const profile = buildInterestProfile([
      { viewCount: 3, tags: ["category:adu", "state:CA"] },
      { viewCount: 1, tags: ["category:adu", "type:loan"] },
      { viewCount: 0, tags: ["state:CA"] },
    ]);
    expect(profile).toEqual({ "category:adu": 4, "state:CA": 4, "type:loan": 1 });
  });

  it("is empty with no views", () => {
    expect(buildInterestProfile([])).toEqual({});
  });
});

describe("topTags", () => {
  it("keeps the strongest tags, breaking ties by name", () => {
    expect(topTags({ b: 2, a: 2, c: 5, d: 1 }, 3)).toEqual({ c: 5, a: 2, b: 2 });
  });
});

describe("buildSmsText", () => {
  it("labels it a community post and ends with the opt-out line", () => {
    const text = buildSmsText({ postUrl: "https://x.test/posts/1", listingName: "CalFresh" });
    expect(text).toContain("community post about CalFresh");
    expect(text).toContain("not an official notice");
    expect(text.endsWith("Reply STOP to opt out.")).toBe(true);
  });

  it("trims a long listing name but keeps the link and opt-out", () => {
    const text = buildSmsText({ postUrl: "https://x.test/posts/1", listingName: "A".repeat(500) });
    expect(text.length).toBeLessThanOrEqual(300);
    expect(text).toContain("https://x.test/posts/1");
    expect(text.endsWith("Reply STOP to opt out.")).toBe(true);
  });
});
