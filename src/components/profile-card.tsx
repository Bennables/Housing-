import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LABELS } from "@/lib/constants";
import { getSavedCounts } from "@/lib/data/stack";
import { initials } from "@/lib/format";
import type { Viewer } from "@/lib/session";

/** The left card: who you are and what you saved. Signed-out visitors get an invitation instead. */
export async function ProfileCard({ viewer }: { viewer: Viewer | null }) {
  if (!viewer) {
    return (
      <section aria-label="Join" className="overflow-hidden rounded-xl border bg-card">
        <div className="h-14 bg-gradient-to-r from-primary to-sky-400" aria-hidden />
        <div className="space-y-3 p-4">
          <p className="font-semibold">Find programs that help with the cost of living</p>
          <p className="text-sm text-muted-foreground">
            Sign in to share what you learn, save programs and track funding.
          </p>
          <Button asChild className="w-full">
            <Link href="/signin">Sign in</Link>
          </Button>
        </div>
      </section>
    );
  }

  const counts = await getSavedCounts(viewer.id);
  return (
    <section aria-label="Your profile" className="overflow-hidden rounded-xl border bg-card">
      <div className="h-14 bg-gradient-to-r from-primary to-sky-400" aria-hidden />
      <div className="px-4 pb-4">
        <Link href="/profile" className="-mt-8 block w-fit">
          <Avatar className="size-16 border-2 border-card">
            {viewer.image ? (
              <AvatarImage src={viewer.image} alt="" referrerPolicy="no-referrer" />
            ) : null}
            <AvatarFallback className="text-lg">{initials(viewer.name)}</AvatarFallback>
          </Avatar>
        </Link>
        <p className="mt-2 font-semibold">{viewer.name ?? "Welcome"}</p>
        <p className="text-sm text-muted-foreground">
          {LABELS.role[viewer.role]}
          {viewer.isAdmin ? " · Admin" : ""}
        </p>
        <dl className="mt-4 space-y-1.5 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Saved listings</dt>
            <dd className="font-semibold text-primary">{counts.listings}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Saved posts</dt>
            <dd className="font-semibold text-primary">{counts.posts}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
