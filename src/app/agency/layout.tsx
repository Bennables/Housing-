import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/agency");
  if (viewer.role === "unassigned") redirect("/onboarding");
  // Admins can look around too. Everyone else needs an agency account. Server Actions check this again.
  if (viewer.role !== "agency" && !viewer.isAdmin) redirect("/feed");
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">{children}</main>;
}
