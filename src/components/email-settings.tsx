"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { disableEmailAlerts, enableEmailAlerts } from "@/lib/actions/notifications";

/** Opt in to emails about new programs. Consent is explicit, and one tap turns it off. */
export function EmailSettings({
  accountEmail,
  enabled,
}: {
  accountEmail: string | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => ReturnType<typeof disableEmailAlerts>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      else {
        setConsent(false);
        router.refresh();
      }
    });
  }

  if (!accountEmail) {
    return (
      <p className="text-sm text-muted-foreground">
        Your account does not have an email address, so we cannot send alerts.
      </p>
    );
  }

  if (enabled) {
    return (
      <div className="space-y-3">
        <p className="text-sm">
          Email alerts are on. We send them to <span className="font-medium">{accountEmail}</span>.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => run(disableEmailAlerts)}
          disabled={pending}
        >
          {pending ? "Turning off…" : "Turn off emails"}
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(() => enableEmailAlerts({ consent }));
      }}
      className="space-y-3"
    >
      <p className="text-sm">
        We would send them to <span className="font-medium">{accountEmail}</span>, the email you
        signed in with.
      </p>
      <div className="flex items-start gap-2">
        <Checkbox
          id="email-consent"
          checked={consent}
          onCheckedChange={(value) => setConsent(value === true)}
          className="mt-0.5"
        />
        <Label htmlFor="email-consent" className="text-sm leading-snug font-normal">
          Email me when a new program is added for me. I can turn this off at any time.
        </Label>
      </div>
      <Button type="submit" disabled={pending || !consent}>
        {pending ? "Sending a test email…" : "Turn on emails"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
