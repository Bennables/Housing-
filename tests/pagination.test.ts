import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor, paginate } from "@/lib/pagination";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const row = (n: number, iso: string) => ({ id: id(n), createdAt: new Date(iso) });

describe("cursor", () => {
  it("round-trips a timestamp and id exactly", () => {
    const createdAt = new Date("2026-03-04T05:06:07.089Z");
    expect(decodeCursor(encodeCursor(createdAt, id(7)))).toEqual({ createdAt, id: id(7) });
  });

  it("rejects missing, garbled and tampered cursors", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("not base64 json")).toBeNull();
    const bad = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
    expect(decodeCursor(bad({ t: "yesterday", id: id(1) }))).toBeNull();
    expect(
      decodeCursor(bad({ t: "2026-03-04T05:06:07.089Z", id: "x'; drop table posts;--" })),
    ).toBeNull();
    expect(decodeCursor(bad([1, 2]))).toBeNull();
    expect(decodeCursor(bad({ t: 5, id: id(1) }))).toBeNull();
  });
});

describe("paginate", () => {
  const rows = [
    row(5, "2026-01-05T00:00:00.000Z"),
    row(4, "2026-01-04T00:00:00.000Z"),
    row(3, "2026-01-03T00:00:00.000Z"),
  ];

  it("returns everything with no next cursor when the page is not full", () => {
    const page = paginate(rows, 3);
    expect(page.items).toHaveLength(3);
    expect(page.nextCursor).toBeNull();
  });

  it("splits off the extra row and points the cursor at the last kept row", () => {
    const page = paginate(rows, 2);
    expect(page.items.map((r) => r.id)).toEqual([id(5), id(4)]);
    expect(decodeCursor(page.nextCursor)).toEqual({ createdAt: rows[1].createdAt, id: id(4) });
  });

  it("handles an empty result", () => {
    expect(paginate([], 10)).toEqual({ items: [], nextCursor: null });
  });
});
