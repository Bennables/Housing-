"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { registerAgency } from "@/lib/actions/onboarding";
import { AGENCY_LEVELS, LABELS } from "@/lib/constants";

/** Asks an admin to verify an agency. The agency starts unverified. */
export function AgencyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await registerAgency({ name, level, website });
      if (!result.ok) setError(result.error);
      else router.push("/agency");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="agency-name">Agency name</Label>
        <Input id="agency-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="agency-level">What kind of agency is it?</Label>
        <NativeSelect id="agency-level" value={level} onChange={(e) => setLevel(e.target.value)} required>
          <option value="">Choose…</option>
          {AGENCY_LEVELS.map((l) => (
            <option key={l} value={l}>
              {LABELS.level[l]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="agency-website">Official website</Label>
        <Input
          id="agency-website"
          type="url"
          inputMode="url"
          placeholder="https://"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          required
        />
      </div>
      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Request verification"}
      </Button>
    </form>
  );
}
