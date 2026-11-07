"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchListingsAction } from "@/lib/actions/feed";

export type PickedListing = { id: string; name: string };

/** Search-as-you-type picker for the listing a post shares. */
export function ListingPicker({
  value,
  onChange,
}: {
  value: PickedListing | null;
  onChange: (listing: PickedListing | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ q: string; items: PickedListing[] } | null>(null);
  const [open, setOpen] = useState(false);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const items = await searchListingsAction(query);
      // Ignore answers that arrive after a newer search started.
      if (!cancelled) setResult({ q: query, items });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  const results = result?.items ?? [];
  const searching = result?.q !== query;

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border bg-accent/50 px-3 py-2 text-sm">
        <span className="min-w-0 truncate">
          <span className="text-muted-foreground">Sharing: </span>
          <span className="font-medium">{value.name}</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Remove ${value.name}`}
          className="shrink-0 rounded-md p-1 hover:bg-accent"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Search listings to share"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md"
        >
          {results.map((r) => (
            <li key={r.id} role="option" aria-selected={false}>
              <button
                type="button"
                className="w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(r);
                  setQuery("");
                  setOpen(false);
                }}
              >
                {r.name}
              </button>
            </li>
          ))}
          {!searching && results.length === 0 ? (
            <li className="px-2.5 py-2 text-sm text-muted-foreground">No listings found.</li>
          ) : null}
          {searching && results.length === 0 ? (
            <li className="px-2.5 py-2 text-sm text-muted-foreground">Searching…</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
