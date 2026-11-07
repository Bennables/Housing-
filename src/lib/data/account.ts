import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function getSmsSettings(
  userId: string,
): Promise<{ smsOptIn: boolean; phone: string | null }> {
  const [row] = await db
    .select({ smsOptIn: users.smsOptIn, phone: users.phone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? { smsOptIn: false, phone: null };
}
