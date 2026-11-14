/** Runs against a real Postgres when TEST_DATABASE_URL is set (CI uses postgres:16); skipped otherwise. */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "./schema.ts";
import { applyWebhook } from "./webhooks.ts";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("applyWebhook", () => {
  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool, { schema });
  const q = (sql: string, params: unknown[] = []) => pool.query(sql, params).then((r) => r.rows);
  const addSession = (sub: string) =>
    q("insert into app.session (id, sub, refresh_token_ciphertext, expires_at) values (gen_random_uuid(), $1, 'x', now() + interval '1 day')", [sub]);

  beforeAll(() => {
    const cwd = fileURLToPath(new URL("..", import.meta.url));
    execFileSync("node", ["src/migrate.ts", "--reset"], { cwd, env: { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url }, stdio: "pipe" });
  });
  afterAll(() => pool.end());

  it("ends only that user's sessions, once per event id", async () => {
    await addSession("usr_a");
    await addSession("usr_a");
    await addSession("usr_b");

    const first = await applyWebhook(db, { eventId: "wev_1", eventType: "access.revoked", endSessionsFor: "usr_a" });
    expect(first).toEqual({ duplicate: false, sessionsEnded: 2, purgeQueued: false });
    expect(await q("select sub from app.session")).toEqual([{ sub: "usr_b" }]);

    await addSession("usr_a");
    expect(await applyWebhook(db, { eventId: "wev_1", eventType: "access.revoked", endSessionsFor: "usr_a" })).toEqual({ duplicate: true });
    expect(await q("select count(*)::int as n from app.session where sub = 'usr_a'")).toEqual([{ n: 1 }]);
  });

  it("queues one purge job for a deleted user", async () => {
    const out = await applyWebhook(db, { eventId: "wev_2", eventType: "user.deleted", endSessionsFor: "usr_a", purgeUser: "usr_a" });
    expect(out).toEqual({ duplicate: false, sessionsEnded: 1, purgeQueued: true });
    await applyWebhook(db, { eventId: "wev_2", eventType: "user.deleted", endSessionsFor: "usr_a", purgeUser: "usr_a" });
    expect(await q("select type, payload, status from app.job")).toEqual([{ type: "purge.user", payload: { sub: "usr_a" }, status: "queued" }]);
  });

  it("records events that need no action, so they're deduplicated too", async () => {
    expect(await applyWebhook(db, { eventId: "wev_3", eventType: "webhook.test" })).toEqual({ duplicate: false, sessionsEnded: 0, purgeQueued: false });
    expect(await q("select event_type from app.webhook_delivery where id = 'wev_3'")).toEqual([{ event_type: "webhook.test" }]);
  });
});
