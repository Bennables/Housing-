import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AgencyForm } from "@/components/agency-form";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Request agency verification" };

export default async function AgencyOnboardingPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/onboarding/agency");
  if (viewer.role === "agency") redirect("/agency");

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Request agency verification</h1>
        <p className="text-sm text-muted-foreground">
          An admin checks every agency before its listings become public. Use your agency&apos;s official website so we
          can confirm who you are.
        </p>
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <AgencyForm />
      </div>
    </main>
  );
}
