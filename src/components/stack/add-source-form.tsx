"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { addStackSource } from "@/lib/actions/capital-stack";
import { FREQUENCIES, LABELS, type ListingType } from "@/lib/constants";

// Sources people bring themselves, listed first. Government program types come from listings.
const SOURCE_TYPES: ListingType[] = [
  "lender",
  "down_payment",
  "employer",
  "donor",
  "earned_revenue",
  "grant",
  "loan",
  "other",
];

const EMPTY = { sourceType: "lender", name: "", amountDollars: "", frequency: "one_time" };

/** Adds a funding source that is not a listing, like a lender commitment or donor pledge. */
export function AddSourceForm() {
  const router = useRouter();
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set =
    (key: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: event.target.value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addStackSource({
        ...values,
        // No amount means no frequency, so the item shows as "amount not known".
        frequency: values.amountDollars.trim() ? values.frequency : "",
      });
      if (!result.ok) setError(result.error);
      else {
        setValues(EMPTY);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="source-type">Kind of funding</Label>
        <NativeSelect id="source-type" value={values.sourceType} onChange={set("sourceType")}>
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {LABELS.listingType[t]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="source-name">Name</Label>
        <Input
          id="source-name"
          placeholder="Employer match from a local hospital"
          value={values.name}
          onChange={set("name")}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="source-amount">Amount ($)</Label>
          <Input
            id="source-amount"
            inputMode="decimal"
            placeholder="Optional"
            value={values.amountDollars}
            onChange={set("amountDollars")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="source-frequency">How often</Label>
          <NativeSelect
            id="source-frequency"
            value={values.frequency}
            onChange={set("frequency")}
            disabled={!values.amountDollars.trim()}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {LABELS.frequency[f]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Adding…" : "Add source"}
      </Button>
    </form>
  );
}
