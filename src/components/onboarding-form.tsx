"use client";

import { Building2, Home, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AgencyForm } from "@/components/agency-form";
import { chooseRole } from "@/lib/actions/onboarding";

const CHOICES = [
  {
    role: "household" as const,
    icon: Home,
    title: "Household",
    text: "I want to find programs that help with food, health, utilities and rent.",
  },
  {
    role: "builder" as const,
    icon: Building2,
    title: "Builder",
    text: "I build or plan affordable housing and want grants, loans and bonuses for my project.",
  },
];

export function OnboardingForm() {
  const router = useRouter();
  const [showAgency, setShowAgency] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(role: "household" | "builder") {
    setError(null);
    startTransition(async () => {
      const result = await chooseRole({ role });
      if (!result.ok) setError(result.error);
      else router.push("/feed");
    });
  }

  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {CHOICES.map(({ role, icon: Icon, title, text }) => (
          <li key={role}>
            <button
              type="button"
              onClick={() => pick(role)}
              disabled={pending}
              className="lift flex h-full w-full flex-col items-start gap-2 rounded-2xl border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-accent/40 disabled:opacity-60"
            >
              <Icon className="size-6 text-primary" aria-hidden />
              <span className="font-heading text-xl">{title}</span>
              <span className="text-sm text-muted-foreground">{text}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border bg-card p-5">
        <button
          type="button"
          onClick={() => setShowAgency((v) => !v)}
          aria-expanded={showAgency}
          className="flex w-full items-center gap-3 text-left"
        >
          <Landmark className="size-6 text-primary" aria-hidden />
          <span>
            <span className="block font-semibold">I represent an agency</span>
            <span className="block text-sm text-muted-foreground">
              Government offices, housing authorities and nonprofits that run a program. An admin
              reviews every agency.
            </span>
          </span>
        </button>

        {showAgency ? (
          <div className="mt-4 border-t pt-4">
            <AgencyForm />
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
