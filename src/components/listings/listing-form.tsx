"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { saveListing } from "@/lib/actions/listings";
import { AUDIENCES, FREQUENCIES, LABELS, LISTING_CATEGORIES, LISTING_LEVELS, LISTING_TYPES } from "@/lib/constants";
import type { ListingFormValues } from "@/lib/listing-form";
import { US_STATES } from "@/lib/states";

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ListingForm({
  listingId,
  initial,
  redirectTo,
}: {
  listingId: string | null;
  initial: ListingFormValues;
  redirectTo: string;
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (key: keyof ListingFormValues) => (e: { target: { value: string } }) =>
    setV((current) => ({ ...current, [key]: e.target.value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveListing(listingId, v);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-5 shadow-xs">
      <Field id="l-name" label="Name">
        <Input id="l-name" value={v.name} onChange={set("name")} required maxLength={160} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="l-type" label="Type">
          <NativeSelect id="l-type" value={v.type} onChange={set("type")} required>
            <option value="">Choose…</option>
            {LISTING_TYPES.map((t) => (
              <option key={t} value={t}>
                {LABELS.listingType[t]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="l-category" label="Category">
          <NativeSelect id="l-category" value={v.category} onChange={set("category")} required>
            <option value="">Choose…</option>
            {LISTING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {LABELS.category[c]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="l-level" label="Level">
          <NativeSelect id="l-level" value={v.level} onChange={set("level")} required>
            <option value="">Choose…</option>
            {LISTING_LEVELS.map((l) => (
              <option key={l} value={l}>
                {LABELS.level[l]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="l-state" label="State" hint="Leave empty for federal listings.">
          <NativeSelect id="l-state" value={v.state} onChange={set("state")} disabled={v.level === "federal"}>
            <option value="">{v.level === "federal" ? "Not needed" : "Choose…"}</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="l-audience" label="Who is it for?">
          <NativeSelect id="l-audience" value={v.targetAudience} onChange={set("targetAudience")} required>
            <option value="">Choose…</option>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {LABELS.audience[a]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field id="l-summary" label="Summary" hint="Plain English. Say what it is and what it pays for.">
        <Textarea id="l-summary" value={v.summary} onChange={set("summary")} rows={4} required maxLength={1000} />
      </Field>

      <Field id="l-eligibility" label="Who can get it" hint="Plain English, under 2000 characters.">
        <Textarea id="l-eligibility" value={v.eligibility} onChange={set("eligibility")} rows={4} maxLength={2000} />
      </Field>

      <Field id="l-url" label="Official link" hint="Every amount, date and rule must come from this page.">
        <Input id="l-url" type="url" inputMode="url" value={v.url} onChange={set("url")} placeholder="https://" required />
      </Field>

      <fieldset className="space-y-3 rounded-lg border border-dashed p-3">
        <legend className="px-1 text-sm font-medium">Amount (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="l-min" label="Lowest ($)">
            <Input id="l-min" inputMode="decimal" value={v.amountMinDollars} onChange={set("amountMinDollars")} />
          </Field>
          <Field id="l-max" label="Highest ($)">
            <Input id="l-max" inputMode="decimal" value={v.amountMaxDollars} onChange={set("amountMaxDollars")} />
          </Field>
          <Field id="l-frequency" label="How often paid" hint="Required for grants, benefits and any amount.">
            <NativeSelect id="l-frequency" value={v.frequency} onChange={set("frequency")}>
              <option value="">Choose…</option>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {LABELS.frequency[f]}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-dashed p-3">
        <legend className="px-1 text-sm font-medium">Dates (optional)</legend>
        <p className="text-xs text-muted-foreground">Leave both empty for rolling applications.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="l-opens" label="Opens on">
            <Input id="l-opens" type="date" value={v.opensOn} onChange={set("opensOn")} />
          </Field>
          <Field id="l-closes" label="Closes on">
            <Input id="l-closes" type="date" value={v.closesOn} onChange={set("closesOn")} />
          </Field>
          <Field id="l-checked" label="Last verified on">
            <Input id="l-checked" type="date" value={v.sourceCheckedOn} onChange={set("sourceCheckedOn")} />
          </Field>
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push(redirectTo)} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : listingId ? "Save changes" : "Publish listing"}
        </Button>
      </div>
    </form>
  );
}
