"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { chooseRole } from "@/lib/actions/onboarding";

export function RoleSwitcher({ current }: { current: "household" | "builder" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const other = current === "household" ? "builder" : "household";

  function switchRole() {
    setError(null);
    startTransition(async () => {
      const result = await chooseRole({ role: other });
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={switchRole} disabled={pending}>
        {pending ? "Switching…" : `Switch to ${other}`}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
