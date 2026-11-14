/** Drizzle mirror of migrations/*.sql (the SQL files are the source of truth). */
import { boolean, char, index, integer, jsonb, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const app = pgSchema("app");
export const collection = pgSchema("collection");

export const session = app.table(
  "session",
  {
    id: uuid("id").primaryKey(),
    sub: text("sub").notNull(),
    orgId: text("org_id"),
    refreshTokenCiphertext: text("refresh_token_ciphertext").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("session_sub_idx").on(t.sub)],
);

export const job = app.table("job", {
  id: uuid("id").primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  status: text("status", { enum: ["queued", "running", "done", "dead"] }).notNull().default("queued"),
  runAfter: timestamp("run_after", { withTimezone: true }).notNull().defaultNow(),
  attempts: integer("attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookDelivery = app.table("webhook_delivery", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collector = collection.table("collector", {
  sub: text("sub").primaryKey(),
  handle: text("handle").notNull(),
  displayName: text("display_name"),
  bioMd: text("bio_md"),
  profileVisibility: text("profile_visibility", { enum: ["private", "public"] }).notNull().default("private"),
  searchIndexing: boolean("search_indexing").notNull().default(false),
  showValues: boolean("show_values").notNull().default(false),
  defaultCurrency: char("default_currency", { length: 3 }).notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
