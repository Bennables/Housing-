import type { Viewer } from "@/lib/session";

/** What a person can do. Components use it to decide between acting and prompting. */
export type ViewerState = "anon" | "unassigned" | "ready";

export function viewerStateOf(viewer: Viewer | null): ViewerState {
  if (!viewer) return "anon";
  return viewer.role === "unassigned" ? "unassigned" : "ready";
}

/** Where to send someone who tries a signed-in action without being able to. */
export function promptHref(state: ViewerState, next: string): string | null {
  if (state === "anon") return `/signin?next=${encodeURIComponent(next)}`;
  if (state === "unassigned") return "/onboarding";
  return null;
}
