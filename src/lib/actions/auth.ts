"use server";

import { signIn, signOut } from "@/lib/auth";

/** Only allow same-site paths, so a crafted link cannot send someone to another site after sign-in. */
export async function safeNext(next: string | null | undefined): Promise<string> {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\"))
    return next;
  return "/feed";
}

export async function signInWithGoogle(next?: string | null) {
  await signIn("google", { redirectTo: await safeNext(next) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/feed" });
}
