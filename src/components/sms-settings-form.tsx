"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SmsFields } from "@/components/sms-fields";
import { Button } from "@/components/ui/button";
import { updateSmsSettings } from "@/lib/actions/onboarding";

export function SmsSettingsForm({
  initialOptIn,
  initialPhone,
}: {
  initialOptIn: boolean;
  initialPhone: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState({ smsOptIn: initialOptIn, phone: initialPhone });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSmsSettings(value);
      if (!result.ok) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <SmsFields
        idPrefix="profile-sms"
        smsOptIn={value.smsOptIn}
        phone={value.phone}
        onChange={(next) => {
          setSaved(false);
          setValue(next);
        }}
        disabled={pending}
      />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Save text settings"}
      </Button>
      {saved ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
