import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

// The Neon serverless driver over HTTP. Use the pooled DATABASE_URL at runtime.
// HTTP mode has no interactive transactions, so group related writes with db.batch([...]).
export const db = drizzle(neon(url), { schema });
export type Db = typeof db;
