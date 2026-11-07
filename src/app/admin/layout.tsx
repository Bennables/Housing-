import { notFound, redirect } from "next/navigation";
import { getViewer } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/admin");
  // Not an admin: pretend the page does not exist. Server Actions check this again.
  if (!viewer.isAdmin) notFound();
  return <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">{children}</main>;
}
