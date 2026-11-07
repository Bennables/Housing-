import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HouseDrawing } from "@/components/house-drawing";
import { Button } from "@/components/ui/button";
import { safeNext, signInWithGoogle } from "@/lib/actions/auth";
import { first, type SearchParams } from "@/lib/params";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const next = await safeNext(first((await searchParams).next));
  if (await getViewer()) redirect(next);

  return (
    <main className="grid min-h-[34rem] lg:grid-cols-2">
      <section
        aria-label="Welcome"
        className="bg-chalk flex flex-col justify-between gap-10 px-8 py-10 text-[oklch(0.96_0.015_95)] sm:px-12"
      >
        <p className="font-mono text-xs tracking-[0.14em] text-[oklch(0.82_0.04_160)] uppercase">
          Closing the Gap
        </p>
        <div className="rise max-w-md space-y-4">
          <h1 className="text-5xl leading-[1.05]">Find funding for housing.</h1>
          <p className="text-lg leading-relaxed text-[oklch(0.88_0.03_160)]">
            Programs run by government offices and nonprofits, in one place. Save what fits and see
            how it covers your cost.
          </p>
        </div>
        <HouseDrawing className="h-auto w-full max-w-sm text-[oklch(0.96_0.015_95)]" />
      </section>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="rise w-full max-w-md space-y-6" style={{ "--i": 2 } as React.CSSProperties}>
          <div className="space-y-2">
            <h2 className="text-3xl leading-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              You can read the feed and listings without an account. Sign in to share, like, comment
              and save.
            </p>
          </div>
          <form
            action={signInWithGoogle.bind(null, next)}
            className="rounded-2xl border bg-card p-6"
          >
            <Button type="submit" size="lg" className="h-11 w-full rounded-full text-base">
              Continue with Google
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              We only use your name, email and photo from Google. We never ask for your income, SSN
              or bank details.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
