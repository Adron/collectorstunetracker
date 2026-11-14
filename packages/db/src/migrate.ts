/**
 * Minimal, portable migration runner: applies migrations/*.sql in order, once each, inside a transaction.
 * Uses DATABASE_URL_UNPOOLED (Neon direct connection) or DATABASE_URL.
 *   node src/migrate.ts          apply pending migrations
 *   node src/migrate.ts --reset  drop CTT's schemas and re-apply (local/dev only)
 *   node src/migrate.ts --build  used by the Vercel build: migrates only production deployments
 *                                (previews share the production database until Neon preview branching is on)
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { withVerifiedSsl } from "./connection.ts";

if (process.argv.includes("--build") && process.env.VERCEL_ENV !== "production") {
  console.log(`migrate: skipped (build for ${process.env.VERCEL_ENV ?? "local"})`);
  process.exit(0);
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("migrate: set DATABASE_URL_UNPOOLED or DATABASE_URL");
  process.exit(1);
}

const dir = fileURLToPath(new URL("../migrations/", import.meta.url));
const SCHEMAS = ["app", "catalog", "collection", "market", "media", "ingest"];

const client = new pg.Client({ connectionString: withVerifiedSsl(url) });
await client.connect();
try {
  if (process.argv.includes("--reset")) {
    if (process.env.VERCEL_ENV === "production") throw new Error("refusing to reset in production");
    for (const s of SCHEMAS) await client.query(`DROP SCHEMA IF EXISTS ${s} CASCADE`);
    console.log("migrate: reset CTT schemas");
  }
  await client.query("CREATE SCHEMA IF NOT EXISTS app");
  await client.query(`CREATE TABLE IF NOT EXISTS app.schema_migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  // One migrator at a time (preview builds can race).
  await client.query("SELECT pg_advisory_lock(727274)");

  const applied = new Set((await client.query<{ name: string }>("SELECT name FROM app.schema_migrations")).rows.map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(dir + file, "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO app.schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`migrate: applied ${file}`);
      count++;
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`migrate: ${file} failed: ${(err as Error).message}`);
    }
  }
  console.log(count ? `migrate: ${count} migration(s) applied` : "migrate: up to date");
} finally {
  await client.end();
}
