import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import type { UserRole } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole; isAdmin: boolean } & DefaultSession["user"];
  }
}

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Add more Auth.js providers here only if the team asks.
  providers: [Google],
  // Sessions live in Postgres, so a role change shows up on the next request.
  session: { strategy: "database" },
  pages: { signIn: "/signin" },
  callbacks: {
    session({ session, user }) {
      // The adapter returns the whole users row, including our extra columns.
      const row = user as typeof user & { role?: UserRole; isAdmin?: boolean };
      session.user.id = user.id;
      session.user.role = row.role ?? "unassigned";
      session.user.isAdmin = row.isAdmin ?? false;
      return session;
    },
  },
  events: {
    // Anyone listed in ADMIN_EMAILS becomes an admin the next time they sign in.
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (user.id && email && adminEmails.has(email)) {
        await db.update(users).set({ isAdmin: true }).where(eq(users.id, user.id));
      }
    },
  },
});
