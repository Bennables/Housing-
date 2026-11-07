import "server-only";
import { cache } from "react";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/constants";

export type Viewer = {
  id: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  isAdmin: boolean;
};

/** The signed-in user for this request, or null. Cached so one request reads the session once. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return {
    id: user.id,
    name: user.name ?? null,
    image: user.image ?? null,
    role: user.role,
    isAdmin: user.isAdmin,
  };
});
