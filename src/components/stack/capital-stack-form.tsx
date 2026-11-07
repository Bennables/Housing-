"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCapitalStack } from "@/lib/actions/capital-stack";

export function CapitalStackForm({
  initial,
}: {
  initial?: { projectName: string; totalCostDollars: string; firstMortgageDollars: string };
}) {
  const router = useRouter();
  const [projectName, setProjectName] = useState(initial?.projectName ?? "");
  const [totalCostDollars, setTotal] = useState(initial?.totalCostDollars ?? "");
  const [firstMortgageDollars, setMortgage] = useState(initial?.firstMortgageDollars ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveCapitalStack({
        projectName,
        totalCostDollars,
        firstMortgageDollars,
      });
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="stack-name">Project name</Label>
        <Input
          id="stack-name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stack-total">Total development cost ($)</Label>
        <Input
          id="stack-total"
          inputMode="decimal"
          placeholder="2,500,000"
          value={totalCostDollars}
          onChange={(e) => setTotal(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stack-mortgage">First mortgage, if any ($)</Label>
        <Input
          id="stack-mortgage"
          inputMode="decimal"
          placeholder="1,000,000"
          value={firstMortgageDollars}
          onChange={(e) => setMortgage(e.target.value)}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save project"}
      </Button>
    </form>
  );
}
