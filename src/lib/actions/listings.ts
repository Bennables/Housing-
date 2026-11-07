"use server";

import { and, eq, like, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { guardAdmin, guardVerifiedAgency } from "@/lib/guards";
import { escapeLike } from "@/lib/data/listings";
import { firstError } from "@/lib/validation/common";
import { listingInputSchema, slugify } from "@/lib/validation/listing";
import { fail, ok, type ActionResult } from "./result";

/** Who is acting: an admin (any listing, or new admin-owned ones) or a verified agency (its own). */
async function resolveActor() {
  const admin = await guardAdmin();
  if (admin.ok)
    return {
      ok: true as const,
      viewer: admin.viewer,
      agencyId: null as string | null,
      isAdmin: true,
    };
  const agency = await guardVerifiedAgency();
  if (agency.ok) {
    return {
      ok: true as const,
      viewer: agency.viewer,
      agencyId: agency.viewer.agencyId,
      isAdmin: false,
    };
  }
  // Report the agency problem when there is one, since that is the more useful message.
  return { ok: false as const, error: agency.error };
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "listing";
  const taken = await db
    .select({ slug: listings.slug })
    .from(listings)
    .where(or(eq(listings.slug, base), like(listings.slug, `${escapeLike(base)}-%`)));
  const used = new Set(taken.map((t) => t.slug));
  if (!used.has(base)) return base;
  for (let n = 2; ; n += 1) {
    if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
  }
}

/** Create a listing (id is null) or update one. Slugs never change once created. */
export async function saveListing(
  listingId: string | null,
  raw: unknown,
): Promise<ActionResult<{ slug: string }>> {
  const actor = await resolveActor();
  if (!actor.ok) return fail(actor.error);

  const parsed = listingInputSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));
  const input = parsed.data;

  try {
    if (listingId === null) {
      const slug = await uniqueSlug(input.name);
      await db.insert(listings).values({
        ...input,
        slug,
        agencyId: actor.agencyId,
        createdById: actor.viewer.id,
      });
      revalidateListings(slug);
      return ok({ slug });
    }

    if (!z.uuid().safeParse(listingId).success) return fail("That listing no longer exists.");
    const [updated] = await db
      .update(listings)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(
          eq(listings.id, listingId),
          // Agencies can only touch their own listings. Admins can edit any.
          actor.isAdmin ? undefined : eq(listings.agencyId, actor.agencyId ?? ""),
        ),
      )
      .returning({ slug: listings.slug });
    if (!updated) return fail("You can only edit your own listings.");
    revalidateListings(updated.slug);
    return ok({ slug: updated.slug });
  } catch {
    return fail("Could not save the listing. Check the form and try again.");
  }
}

/** Closing sets closesAt to now. Listings are never deleted, so they show up under past listings. */
export async function closeListing(listingId: string): Promise<ActionResult> {
  const actor = await resolveActor();
  if (!actor.ok) return fail(actor.error);
  if (!z.uuid().safeParse(listingId).success) return fail("That listing no longer exists.");

  const [closed] = await db
    .update(listings)
    .set({
      closesAt: sql`now()`,
      // Closing a listing that has not opened yet must not leave it closing before it opens.
      opensAt: sql`case when ${listings.opensAt} > now() then now() else ${listings.opensAt} end`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(listings.id, listingId),
        sql`(${listings.closesAt} is null or ${listings.closesAt} > now())`,
        actor.isAdmin ? undefined : eq(listings.agencyId, actor.agencyId ?? ""),
      ),
    )
    .returning({ slug: listings.slug });
  if (!closed) return fail("That listing is already closed, or it is not yours.");

  revalidateListings(closed.slug);
  return ok();
}

function revalidateListings(slug: string) {
  revalidatePath("/listings");
  revalidatePath(`/listings/${slug}`);
  revalidatePath("/agency");
  revalidatePath("/admin");
}
