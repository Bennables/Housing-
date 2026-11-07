import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { agencies } from "@/db/schema";
import { getViewer, type Viewer } from "@/lib/session";

// Every Server Action calls one of these first. They read the session themselves and never
// trust hidden form fields for author or role.

export type Guard<T = Viewer> = { ok: true; viewer: T } | { ok: false; error: string };

export const SIGN_IN_REQUIRED = "Sign in to do that.";
export const ONBOARDING_REQUIRED = "Choose how you will use the site first.";

export async function guardSignedIn(): Promise<Guard> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: SIGN_IN_REQUIRED };
  return { ok: true, viewer };
}

export async function guardOnboarded(): Promise<Guard> {
  const guard = await guardSignedIn();
  if (!guard.ok) return guard;
  if (guard.viewer.role === "unassigned") return { ok: false, error: ONBOARDING_REQUIRED };
  return guard;
}

export async function guardRole(role: Viewer["role"]): Promise<Guard> {
  const guard = await guardOnboarded();
  if (!guard.ok) return guard;
  if (guard.viewer.role !== role) {
    return { ok: false, error: "Your account type cannot do that." };
  }
  return guard;
}

export async function guardAdmin(): Promise<Guard> {
  const guard = await guardSignedIn();
  if (!guard.ok) return guard;
  if (!guard.viewer.isAdmin) return { ok: false, error: "Only admins can do that." };
  return guard;
}

/** A signed-in agency account whose agency an admin has verified. */
export async function guardVerifiedAgency(): Promise<
  Guard<Viewer & { agencyId: string }> | { ok: false; error: string }
> {
  const guard = await guardRole("agency");
  if (!guard.ok) return guard;
  const [agency] = await db
    .select({ id: agencies.id })
    .from(agencies)
    .where(and(eq(agencies.userId, guard.viewer.id), eq(agencies.verified, true)))
    .limit(1);
  if (!agency) {
    return { ok: false, error: "Your agency has not been verified yet." };
  }
  return { ok: true, viewer: { ...guard.viewer, agencyId: agency.id } };
}
