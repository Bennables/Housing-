import { z } from "zod";

/** Turning on email alerts needs a clear yes. The address is the one the person signed in with. */
export const emailOptInSchema = z.object({
  consent: z.literal(true, { error: "Check the box to agree to get emails." }),
});
