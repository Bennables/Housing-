import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/onboarding");
  if (viewer.role !== "unassigned") redirect(viewer.role === "agency" ? "/agency" : "/feed");

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">How will you use Closing the Gap?</h1>
        <p className="text-sm text-muted-foreground">
          This sets which programs and posts we show you first. Households and builders can switch later from their
          profile.
        </p>
      </div>
      <OnboardingForm />
    </main>
  );
}
