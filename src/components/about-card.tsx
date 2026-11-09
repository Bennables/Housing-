import Link from "next/link";

/** The right card for people without a personal summary, such as signed-out visitors. */
export function AboutCard() {
  return (
    <section aria-label="About" className="space-y-2 rounded-xl border bg-card p-4">
      <h2 className="font-semibold">About Gapless</h2>
      <p className="text-sm text-muted-foreground">
        One place to find government programs and funding. Households find help with food, health,
        utilities and rent. Builders find grants, loans and bonuses.
      </p>
      <ul className="space-y-1 text-sm">
        <li>
          <span className="font-medium">Listings</span> are official, from verified agencies.
        </li>
        <li>
          <span className="font-medium">Posts</span> come from the community. Check every source.
        </li>
      </ul>
      <Link
        href="/listings"
        className="inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        Browse all listings
      </Link>
    </section>
  );
}
