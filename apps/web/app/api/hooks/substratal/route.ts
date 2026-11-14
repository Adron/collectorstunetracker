import { applyWebhook, getDb } from "@ctt/db";
import { parseEvent, parseSecrets, planWebhook, verifySignature } from "@ctt/core/substratal-webhook";

/**
 * Substratal webhook receiver (docs/spec/04 §6, docs/setup-on-substratal.md step 8).
 * 2xx means "handled, don't retry". Anything else makes Substratal retry (up to 6 attempts over about 15 hours),
 * so a missing secret or a database error answers 503/500 rather than dropping the event.
 */
const APPLICATION_ID = process.env.SUBSTRATAL_APP_ID ?? "app_collectors-tune-tracker";

export async function POST(request: Request) {
  const secrets = parseSecrets(process.env.SUBSTRATAL_WEBHOOK_SECRET);
  if (secrets.length === 0) return Response.json({ error: "not_configured" }, { status: 503 });

  const raw = new Uint8Array(await request.arrayBuffer());
  if (!verifySignature(raw, request.headers.get("substratal-signature"), secrets)) {
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }
  const event = parseEvent(raw);
  if (!event) return Response.json({ error: "invalid_event" }, { status: 400 });
  if (!process.env.DATABASE_URL) return Response.json({ error: "not_configured" }, { status: 503 });

  const plan = planWebhook(event, APPLICATION_ID);
  try {
    const outcome = await applyWebhook(getDb(), { eventId: event.id, eventType: event.type, ...plan });
    console.info("substratal webhook", { event: event.id, type: event.type, ignored: plan.ignored, ...outcome });
    return Response.json({ ok: true, event: event.id, ignored: plan.ignored, ...outcome });
  } catch (err) {
    console.error("substratal webhook failed", { event: event.id, type: event.type, err });
    return Response.json({ error: "internal" }, { status: 500 });
  }
}
