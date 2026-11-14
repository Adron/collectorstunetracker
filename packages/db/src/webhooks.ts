import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "./schema.ts";
import { job, session, webhookDelivery } from "./schema.ts";

export interface WebhookActions {
  /** Substratal's event id (`wev_…`), stable across retries. */
  eventId: string;
  eventType: string;
  endSessionsFor?: string;
  purgeUser?: string;
}

export type WebhookOutcome = { duplicate: true } | { duplicate: false; sessionsEnded: number; purgeQueued: boolean };

/**
 * Applies one webhook event exactly once. Recording the event id, ending sessions and queueing the purge share a
 * transaction, so a failure rolls everything back and Substratal's retry starts clean; a redelivery is a no-op.
 */
export async function applyWebhook(db: NodePgDatabase<typeof schema>, a: WebhookActions): Promise<WebhookOutcome> {
  return db.transaction(async (tx) => {
    const recorded = await tx
      .insert(webhookDelivery)
      .values({ id: a.eventId, eventType: a.eventType })
      .onConflictDoNothing()
      .returning({ id: webhookDelivery.id });
    if (recorded.length === 0) return { duplicate: true };

    let sessionsEnded = 0;
    if (a.endSessionsFor) {
      const ended = await tx.delete(session).where(eq(session.sub, a.endSessionsFor)).returning({ id: session.id });
      sessionsEnded = ended.length;
    }
    if (a.purgeUser) {
      await tx.insert(job).values({ id: randomUUID(), type: "purge.user", payload: { sub: a.purgeUser } });
    }
    return { duplicate: false, sessionsEnded, purgeQueued: Boolean(a.purgeUser) };
  });
}
