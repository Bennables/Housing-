import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  FREQUENCIES,
  LABELS,
  LISTING_CATEGORIES,
  LISTING_LEVELS,
  LISTING_TYPES,
} from "@/lib/constants";
import { US_STATES } from "@/lib/states";
import type { ListingFilters } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "current", label: "All current" },
  { value: "open", label: "Open now" },
  { value: "upcoming", label: "Upcoming" },
  { value: "rolling", label: "Rolling" },
  { value: "closed", label: "Past (closed)" },
] as const;

function Field({
  id,
  label,
  children,
  wide = false,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  /** Spans both columns on phones. */
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2 space-y-1 lg:col-span-1" : "space-y-1"}>
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/** A plain GET form, so filters live in the URL and work without JavaScript. */
export function ListingFiltersForm({
  filters,
  showAudience,
  audience,
}: {
  filters: ListingFilters;
  showAudience: boolean;
  audience: "builder" | "household";
}) {
  const hasFilters = Boolean(
    filters.type ||
    filters.category ||
    filters.level ||
    filters.state ||
    filters.frequency ||
    filters.q ||
    (filters.status && filters.status !== "current"),
  );
  return (
    <form
      method="get"
      action="/listings"
      className="rounded-xl border bg-card p-4 shadow-xs"
      aria-label="Filter listings"
    >
      {showAudience ? <input type="hidden" name="audience" value={audience} /> : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Field id="f-q" label="Search by name" wide>
          <Input id="f-q" name="q" defaultValue={filters.q ?? ""} placeholder="CalFresh, ADU…" />
        </Field>
        <Field id="f-status" label="Status">
          <NativeSelect id="f-status" name="status" defaultValue={filters.status ?? "current"}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="f-type" label="Type">
          <NativeSelect id="f-type" name="type" defaultValue={filters.type ?? ""}>
            <option value="">Any type</option>
            {LISTING_TYPES.map((t) => (
              <option key={t} value={t}>
                {LABELS.listingType[t]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="f-category" label="Category">
          <NativeSelect id="f-category" name="category" defaultValue={filters.category ?? ""}>
            <option value="">Any category</option>
            {LISTING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {LABELS.category[c]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="f-level" label="Level">
          <NativeSelect id="f-level" name="level" defaultValue={filters.level ?? ""}>
            <option value="">Any level</option>
            {LISTING_LEVELS.map((l) => (
              <option key={l} value={l}>
                {LABELS.level[l]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="f-state" label="State">
          <NativeSelect id="f-state" name="state" defaultValue={filters.state ?? ""}>
            <option value="">Any state</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="f-frequency" label="How often paid">
          <NativeSelect id="f-frequency" name="frequency" defaultValue={filters.frequency ?? ""}>
            <option value="">Any</option>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {LABELS.frequency[f]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="col-span-2 flex items-end gap-2 lg:col-span-1">
          <Button type="submit" size="lg">
            Apply filters
          </Button>
          {hasFilters ? (
            <Button asChild variant="ghost" size="lg">
              <Link href={showAudience ? `/listings?audience=${audience}` : "/listings"}>
                Reset
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
