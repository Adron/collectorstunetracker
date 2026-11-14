import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { withVerifiedSsl } from "./connection.ts";
import * as schema from "./schema.ts";

export { schema };
export { applyWebhook, type WebhookActions, type WebhookOutcome } from "./webhooks.ts";

let pool: pg.Pool | undefined;

/** Shared pool per server instance (Vercel Fluid compute reuses instances). Uses the pooled DATABASE_URL. */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  pool ??= new pg.Pool({ connectionString: withVerifiedSsl(url), max: 5, idleTimeoutMillis: 10_000 });
  return drizzle(pool, { schema });
}

/** Lightweight connectivity check for /api/health. */
export async function ping(): Promise<boolean> {
  const db = getDb();
  await db.execute("select 1");
  return true;
}
