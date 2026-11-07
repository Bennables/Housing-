"use client";

import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { ListingPicker, type PickedListing } from "@/components/feed/listing-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/lib/actions/posts";
import { FREQUENCIES, LABELS } from "@/lib/constants";
import { US_STATES, stateName } from "@/lib/states";
import { ELIGIBILITY_MAX, POST_BODY_MAX } from "@/lib/validation/post";

export function Composer({ initialListing }: { initialListing: PickedListing | null }) {
  const [body, setBody] = useState("");
  const [listing, setListing] = useState<PickedListing | null>(initialListing);
  const [states, setStates] = useState<string[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [benefitDollars, setBenefitDollars] = useState("");
  const [benefitFrequency, setBenefitFrequency] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPosted(false);
    startTransition(async () => {
      const result = await createPost({
        body,
        listingId: listing?.id ?? "",
        states,
        sourceUrl,
        // A shared listing carries its own amount and eligibility, so those fields are not sent.
        benefitDollars: listing ? "" : benefitDollars,
        benefitFrequency: listing ? "" : benefitFrequency,
        eligibility: listing ? "" : eligibility,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
      setListing(null);
      setStates([]);
      setSourceUrl("");
      setBenefitDollars("");
      setBenefitFrequency("");
      setEligibility("");
      setPosted(true);
    });
  }

  return (
    <form
      id="composer"
      onSubmit={submit}
      className="scroll-mt-20 space-y-4 rounded-xl border bg-card p-4 shadow-xs sm:p-5"
      aria-labelledby="composer-title"
    >
      <h2 id="composer-title" className="font-semibold">
        Share an opportunity
      </h2>

      <div className="space-y-1.5">
        <Label htmlFor="post-body">What do you want to share?</Label>
        <Textarea
          id="post-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={POST_BODY_MAX}
          placeholder="Applications for this program open Monday. Here is how I applied…"
          required
        />
        <p className="text-right text-xs text-muted-foreground">
          {body.length}/{POST_BODY_MAX}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Attach an official listing</Label>
        <ListingPicker value={listing} onChange={setListing} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="post-source">
          Source link {listing ? "(optional)" : "(required if no listing is attached)"}
        </Label>
        <Input
          id="post-source"
          type="url"
          inputMode="url"
          placeholder="https://"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
      </div>

      {!listing ? (
        <fieldset className="space-y-4 rounded-lg border border-dashed p-3">
          <legend className="px-1 text-sm font-medium">About this opportunity (optional)</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="post-benefit">Potential benefits ($)</Label>
              <Input
                id="post-benefit"
                inputMode="decimal"
                placeholder="250"
                value={benefitDollars}
                onChange={(e) => setBenefitDollars(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="post-frequency">How often</Label>
              <NativeSelect
                id="post-frequency"
                value={benefitFrequency}
                onChange={(e) => setBenefitFrequency(e.target.value)}
              >
                <option value="">Choose…</option>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {LABELS.frequency[f]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="post-eligibility">Eligibility requirements</Label>
            <Textarea
              id="post-eligibility"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              rows={2}
              maxLength={ELIGIBILITY_MAX}
              placeholder="Who can get it? Household size, location, other rules…"
            />
          </div>
        </fieldset>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="post-state">State tags</Label>
        <NativeSelect
          id="post-state"
          value=""
          onChange={(e) => {
            const code = e.target.value;
            if (code && !states.includes(code)) setStates([...states, code]);
          }}
        >
          <option value="">Add a state…</option>
          {US_STATES.filter((s) => !states.includes(s.code)).map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
        {states.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {states.map((code) => (
              <li
                key={code}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium"
              >
                {stateName(code)}
                <button
                  type="button"
                  aria-label={`Remove ${stateName(code)}`}
                  onClick={() => setStates(states.filter((s) => s !== code))}
                  className="rounded p-0.5 hover:bg-accent"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {posted ? (
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          Posted. Thanks for sharing.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || body.trim() === ""}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
