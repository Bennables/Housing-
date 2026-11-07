import { randomUUID } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
import { inArray, like } from "drizzle-orm";
import { db } from "../src/db";
import { listings, sessions, users } from "../src/db/schema";
import type { UserRole } from "../src/lib/constants";

// Google OAuth cannot be automated. Instead each test creates a user and a database session
// directly, then sets the session cookie Auth.js reads. No test-only code ships in the app.

const EMAIL_SUFFIX = "@e2e.invalid";

export async function signInAs(
  context: BrowserContext,
  options: { name: string; role?: UserRole; isAdmin?: boolean },
) {
  const id = randomUUID();
  await db.insert(users).values({
    id,
    name: options.name,
    email: `e2e-${id}${EMAIL_SUFFIX}`,
    role: options.role ?? "unassigned",
    isAdmin: options.isAdmin ?? false,
  });
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await db.insert(sessions).values({ sessionToken, userId: id, expires });
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(expires.getTime() / 1000),
    },
  ]);
  return { id };
}

/** Removes everything the tests created. Posts, comments, likes and saves cascade from users. */
export async function cleanupE2eData() {
  // Set E2E_KEEP=1 to leave the data in place for debugging a failure.
  if (process.env.E2E_KEEP) return;
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.email, `%${EMAIL_SUFFIX}`));
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return;
  // Listings reference their creator without a cascade, so they go first.
  await db.delete(listings).where(inArray(listings.createdById, ids));
  await db.delete(users).where(inArray(users.id, ids));
}

export const unique = (label: string) =>
  `${label} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
