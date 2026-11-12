/**
 * Runs the migrations against a real Postgres when TEST_DATABASE_URL is set (CI uses postgres:16).
 * Skipped otherwise, so `npm test` works without a database.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("migrations", () => {
  it("apply cleanly from scratch and are idempotent", async () => {
    const cwd = fileURLToPath(new URL("..", import.meta.url));
    const env = { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url };
    execFileSync("node", ["src/migrate.ts", "--reset"], { cwd, env, stdio: "pipe" });
    const second = execFileSync("node", ["src/migrate.ts"], { cwd, env }).toString();
    expect(second).toContain("up to date");

    const client = new pg.Client({ connectionString: url });
    await client.connect();
    const { rows } = await client.query("select count(*)::int as n from app.schema_migrations");
    expect(rows[0].n).toBeGreaterThan(0);
    await expect(client.query("insert into collection.collector (sub, handle) values ('s1', 'Bad Handle!')")).rejects.toThrow();
    await client.end();
  });
});
