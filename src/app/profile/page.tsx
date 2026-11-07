import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RoleSwitcher } from "@/components/role-switcher";
import { VerifiedAgencyBadge } from "@/components/source-badge";
import { Button } from "@/components/ui/button";
import { LABELS } from "@/lib/constants";
import { getAgencyForUser } from "@/lib/data/agency";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/profile");
  if (viewer.role === "unassigned") redirect("/onboarding");
  const agency = viewer.role === "agency" ? await getAgencyForUser(viewer.id) : null;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>

      <section className="space-y-1 rounded-xl border bg-card p-5 shadow-xs">
        <p className="font-medium">{viewer.name ?? "Signed in"}</p>
        <p className="text-sm text-muted-foreground">
          {LABELS.role[viewer.role]}
          {viewer.isAdmin ? " · Admin" : ""}
        </p>
      </section>

      {viewer.role === "household" || viewer.role === "builder" ? (
        <section className="space-y-3 rounded-xl border bg-card p-5 shadow-xs">
          <h2 className="font-semibold">Your role</h2>
          <p className="text-sm text-muted-foreground">
            You are using the site as a {viewer.role}. You can switch any time.
          </p>
          <RoleSwitcher current={viewer.role} />
        </section>
      ) : null}

      {agency ? (
        <section className="space-y-3 rounded-xl border bg-card p-5 shadow-xs">
          <h2 className="font-semibold">Your agency</h2>
          <p>{agency.name}</p>
          {agency.verified ? (
            <VerifiedAgencyBadge />
          ) : (
            <p className="text-sm text-muted-foreground">
              Waiting for an admin to verify your agency.
            </p>
          )}
          <Button asChild variant="outline">
            <Link href="/agency">Open agency dashboard</Link>
          </Button>
        </section>
      ) : null}

      {viewer.role !== "agency" ? (
        <section className="space-y-2 rounded-xl border bg-card p-5 shadow-xs">
          <h2 className="font-semibold">Represent an agency?</h2>
          <p className="text-sm text-muted-foreground">
            Agencies publish official listings. An admin verifies every agency first.
          </p>
          <Button asChild variant="outline">
            <Link href="/onboarding/agency">Request agency verification</Link>
          </Button>
        </section>
      ) : null}
    </main>
  );
}
