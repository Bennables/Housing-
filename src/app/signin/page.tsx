import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { safeNext, signInWithGoogle } from "@/lib/actions/auth";
import { first, type SearchParams } from "@/lib/params";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const next = await safeNext(first((await searchParams).next));
  if (await getViewer()) redirect(next);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          You can read the feed and listings without an account. Sign in to share, like, comment and
          save.
        </p>
      </div>
      <form
        action={signInWithGoogle.bind(null, next)}
        className="rounded-xl border bg-card p-6 shadow-xs"
      >
        <Button type="submit" size="lg" className="w-full">
          Continue with Google
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          We only use your name, email and photo from Google. We never ask for your income, SSN or
          bank details.
        </p>
      </form>
    </main>
  );
}
