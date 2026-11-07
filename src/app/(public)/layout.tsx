import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CapitalStackSidebar } from "@/components/stack/capital-stack-sidebar";
import { HouseholdSidebar } from "@/components/stack/household-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getViewer } from "@/lib/session";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  // Signed-in people pick a role first. Server Actions check this too, since a layout is not a gate.
  if (viewer?.role === "unassigned") redirect("/onboarding");

  const sidebar =
    viewer?.role === "builder" ? (
      <CapitalStackSidebar userId={viewer.id} />
    ) : viewer?.role === "household" ? (
      <HouseholdSidebar userId={viewer.id} />
    ) : null;

  return (
    <div
      className={
        sidebar
          ? "mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px]"
          : "mx-auto max-w-3xl px-4 py-6"
      }
    >
      <main className="min-w-0">{children}</main>
      {sidebar ? (
        <aside aria-label="Your summary" className="lg:sticky lg:top-20 lg:self-start">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>{sidebar}</Suspense>
        </aside>
      ) : null}
    </div>
  );
}
