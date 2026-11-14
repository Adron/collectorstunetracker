/**
 * Substratal webhooks (docs/spec/04 §6): signature check and what each event means for CTT.
 * Pure apart from node:crypto, so it's server-only; it's exported as "@ctt/core/substratal-webhook", not from the index.
 * Signing scheme: substratalapps.com/docs/api-reference/webhooks.md → "Verifying the signature".
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Deliveries signed more than this long ago are rejected, so a captured delivery can't be replayed. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * Checks `Substratal-Signature: t=<unix>,v1=<hex>[,v1=<hex>]` against the raw request body.
 * `secrets` holds the current signing secret, or the new and old ones during a rotation; any match is enough.
 */
export function verifySignature(
  rawBody: Uint8Array,
  header: string | null,
  secrets: readonly string[],
  nowSeconds = Date.now() / 1000,
): boolean {
  if (!header || secrets.length === 0) return false;
  const pairs = header.split(",").map((part) => {
    const i = part.indexOf("=");
    return i < 0 ? [part.trim(), ""] : [part.slice(0, i).trim(), part.slice(i + 1).trim()];
  });
  const t = Number(pairs.find(([k]) => k === "t")?.[1]);
  if (!Number.isInteger(t) || t <= 0 || Math.abs(nowSeconds - t) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const sigs = pairs
    .filter(([k, v]) => k === "v1" && /^[0-9a-f]{64}$/i.test(v ?? ""))
    .map(([, v]) => Buffer.from(v!, "hex"));
  return secrets.some((secret) => {
    const expected = createHmac("sha256", secret).update(`${t}.`).update(rawBody).digest();
    return sigs.some((sig) => timingSafeEqual(sig, expected));
  });
}

/** `SUBSTRATAL_WEBHOOK_SECRET`, comma-separated during a rotation (new first). */
export function parseSecrets(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface WebhookEvent {
  id: string;
  type: string;
  created_at?: string;
  application_id?: string | null;
  test_mode?: boolean;
  data?: { user_id?: string; application_id?: string; [key: string]: unknown };
}

/** Parses a delivery body. Returns null unless it has the event id and type CTT relies on. */
export function parseEvent(rawBody: Uint8Array): WebhookEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const e = value as WebhookEvent;
  return typeof e.id === "string" && e.id && typeof e.type === "string" && e.type ? e : null;
}

export interface WebhookPlan {
  /** End every CTT session for this Substratal user, so their next request signs in again. */
  endSessionsFor?: string;
  /** Queue a `purge.user` job for this Substratal user. */
  purgeUser?: string;
  /** Why nothing happens, for the response body and logs. */
  ignored?: "other_application" | "no_user" | "no_action";
}

/**
 * What CTT does for an event. Losing access, losing a role, suspension and deletion all end the user's sessions;
 * signing in again re-runs Substratal's checks and fetches current permissions. Deletion also purges their data.
 */
export function planWebhook(event: WebhookEvent, applicationId: string): WebhookPlan {
  const appIds = [event.application_id, event.data?.application_id].filter((v): v is string => typeof v === "string");
  if (appIds.some((id) => id !== applicationId)) return { ignored: "other_application" };

  const ends = ["access.revoked", "role.removed", "user.suspended", "user.deleted"];
  if (!ends.includes(event.type)) return { ignored: "no_action" };

  const user = event.data?.user_id;
  if (typeof user !== "string" || !user) return { ignored: "no_user" };
  return event.type === "user.deleted" ? { endSessionsFor: user, purgeUser: user } : { endSessionsFor: user };
}
