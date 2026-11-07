import Link from "next/link";
import { Suspense } from "react";
import { MainNav } from "@/components/main-nav";
import { NotificationBell, NotificationBellFallback } from "@/components/notification-bell";
import { UserMenu } from "@/components/user-menu";
import { getViewer } from "@/lib/session";
import { Button } from "@/components/ui/button";

async function HeaderAccount() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <Button asChild size="sm">
        <Link href="/signin">Sign in</Link>
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <Suspense fallback={<NotificationBellFallback />}>
        <NotificationBell userId={viewer.id} />
      </Suspense>
      <UserMenu
        name={viewer.name}
        image={viewer.image}
        role={viewer.role}
        isAdmin={viewer.isAdmin}
      />
    </div>
  );
}

async function HeaderNav() {
  const viewer = await getViewer();
  const links = [
    { href: "/feed", label: "Feed" },
    { href: "/listings", label: "Listings" },
    ...(viewer?.role === "agency" ? [{ href: "/agency", label: "My agency" }] : []),
    ...(viewer?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  return <MainNav links={links} />;
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-6">
        <Link href="/feed" className="shrink-0 text-base font-semibold tracking-tight text-primary">
          Closing the Gap
        </Link>
        <Suspense
          fallback={
            <MainNav
              links={[
                { href: "/feed", label: "Feed" },
                { href: "/listings", label: "Listings" },
              ]}
            />
          }
        >
          <HeaderNav />
        </Suspense>
        <div className="ml-auto">
          <Suspense fallback={<div className="size-8 rounded-full bg-muted" aria-hidden />}>
            <HeaderAccount />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
