export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** The first value of a query parameter, trimmed, or undefined when empty. */
export function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
}

export function oneOf<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  return allowed.find((a) => a === value);
}
