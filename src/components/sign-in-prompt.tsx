import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ViewerState } from "@/components/viewer-state";

export function SignInPrompt({ state, next, children }: { state: ViewerState; next: string; children: React.ReactNode }) {
  if (state === "ready") return null;
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">{children}</p>
      <Button asChild size="sm">
        <Link href={state === "anon" ? `/signin?next=${encodeURIComponent(next)}` : "/onboarding"}>
          {state === "anon" ? "Sign in" : "Choose your role"}
        </Link>
      </Button>
    </div>
  );
}
