import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">We could not find that page</h1>
      <p className="text-sm text-muted-foreground">
        It may have been removed, or the link may be wrong.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/feed">Go to the feed</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/listings">Browse listings</Link>
        </Button>
      </div>
    </main>
  );
}
