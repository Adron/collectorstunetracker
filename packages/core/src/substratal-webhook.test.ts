import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseEvent, parseSecrets, planWebhook, verifySignature, type WebhookEvent } from "./substratal-webhook";

const APP = "app_collectors-tune-tracker";
const NOW = 1_763_000_000;
const body = new TextEncoder().encode('{"id":"wev_1","type":"access.revoked"}');
const sign = (secret: string, t: number, raw: Uint8Array = body) =>
  createHmac("sha256", secret).update(`${t}.`).update(raw).digest("hex");

describe("verifySignature", () => {
  it("accepts a fresh signature made with the secret", () => {
    expect(verifySignature(body, `t=${NOW},v1=${sign("whsec_a", NOW)}`, ["whsec_a"], NOW)).toBe(true);
  });

  it("rejects a different secret, a changed body, or a missing header", () => {
    const header = `t=${NOW},v1=${sign("whsec_a", NOW)}`;
    expect(verifySignature(body, header, ["whsec_b"], NOW)).toBe(false);
    expect(verifySignature(new TextEncoder().encode('{"id":"wev_1","type":"access.granted"}'), header, ["whsec_a"], NOW)).toBe(false);
    expect(verifySignature(body, null, ["whsec_a"], NOW)).toBe(false);
    expect(verifySignature(body, header, [], NOW)).toBe(false);
  });

  it("rejects signatures older or newer than five minutes", () => {
    const old = NOW - 301;
    expect(verifySignature(body, `t=${old},v1=${sign("whsec_a", old)}`, ["whsec_a"], NOW)).toBe(false);
    const edge = NOW - 300;
    expect(verifySignature(body, `t=${edge},v1=${sign("whsec_a", edge)}`, ["whsec_a"], NOW)).toBe(true);
  });

  it("accepts either secret during a rotation, with two v1 entries", () => {
    const header = `t=${NOW},v1=${sign("whsec_new", NOW)},v1=${sign("whsec_old", NOW)}`;
    expect(verifySignature(body, header, ["whsec_old"], NOW)).toBe(true);
    expect(verifySignature(body, `t=${NOW},v1=${sign("whsec_old", NOW)}`, ["whsec_new", "whsec_old"], NOW)).toBe(true);
  });

  it("ignores malformed v1 values instead of throwing", () => {
    expect(verifySignature(body, `t=${NOW},v1=zz,v1=abc`, ["whsec_a"], NOW)).toBe(false);
    expect(verifySignature(body, `v1=${sign("whsec_a", NOW)}`, ["whsec_a"], NOW)).toBe(false);
  });
});

describe("parseSecrets", () => {
  it("splits a rotation pair and drops blanks", () => {
    expect(parseSecrets(" whsec_new , whsec_old ,")).toEqual(["whsec_new", "whsec_old"]);
    expect(parseSecrets(undefined)).toEqual([]);
  });
});

describe("parseEvent", () => {
  it("needs an id and a type", () => {
    expect(parseEvent(body)?.id).toBe("wev_1");
    expect(parseEvent(new TextEncoder().encode('{"type":"access.revoked"}'))).toBeNull();
    expect(parseEvent(new TextEncoder().encode("not json"))).toBeNull();
  });
});

describe("planWebhook", () => {
  const event = (type: string, data: WebhookEvent["data"] = { user_id: "usr_1" }): WebhookEvent => ({
    id: "wev_1",
    type,
    application_id: APP,
    data,
  });

  it("ends sessions when access, a role, or the account is lost", () => {
    for (const type of ["access.revoked", "role.removed", "user.suspended"]) {
      expect(planWebhook(event(type), APP)).toEqual({ endSessionsFor: "usr_1" });
    }
  });

  it("also purges the user's data when the account is deleted", () => {
    expect(planWebhook(event("user.deleted"), APP)).toEqual({ endSessionsFor: "usr_1", purgeUser: "usr_1" });
  });

  it("does nothing for grants, assignments, review changes and tests", () => {
    for (const type of ["access.granted", "role.assigned", "application.review_status_changed", "webhook.test"]) {
      expect(planWebhook(event(type), APP)).toEqual({ ignored: "no_action" });
    }
  });

  it("ignores events about another application", () => {
    expect(planWebhook({ ...event("access.revoked"), application_id: "app_other" }, APP).ignored).toBe("other_application");
    expect(planWebhook(event("access.revoked", { user_id: "usr_1", application_id: "app_other" }), APP).ignored).toBe(
      "other_application",
    );
  });

  it("ignores a session-ending event without a user", () => {
    expect(planWebhook(event("access.revoked", {}), APP)).toEqual({ ignored: "no_user" });
  });
});
