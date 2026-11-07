export type FeedCursor = { t: string; id: string };

export const FEED_PAGE_SIZE = 10;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Opaque cursor for (createdAt, id). Timestamps are stored with millisecond precision so this is exact. */
export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ t: createdAt.toISOString(), id } satisfies FeedCursor)).toString(
    "base64url",
  );
}

export function decodeCursor(value: string | null | undefined): { createdAt: Date; id: string } | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null) return null;
    const { t, id } = parsed as Record<string, unknown>;
    if (typeof t !== "string" || typeof id !== "string" || !UUID.test(id)) return null;
    const createdAt = new Date(t);
    if (Number.isNaN(createdAt.getTime()) || createdAt.toISOString() !== t) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

/** Fetch pageSize + 1 rows, then split off the extra row to learn whether there is a next page. */
export function paginate<T extends { createdAt: Date; id: string }>(rows: T[], pageSize: number) {
  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : rows;
  const last = items[items.length - 1];
  return { items, nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null };
}
