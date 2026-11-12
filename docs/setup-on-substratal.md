# Setting up CTT on Substratal Apps

Run this guide by hand, once, to register **Collectors' Tune Tracker** on the Substratal Apps platform as a
customer would. It uses only the public API at `https://api.substratalapps.com`. There are no staff permissions,
no concierge steps, and no database access. Request shapes follow the platform docs in
`substratalapps.com/docs/api-reference/` (applications, organizations, webhooks, api-keys, auth).

| Thing | Value |
|---|---|
| Managing account | `admin-ctt@thrashingcode.com` |
| Organization | **Collectors' Tune Tracker** |
| Production app | slug `ctt` → `app_ctt` |
| Dev app | slug `ctt-dev` → `app_ctt-dev` (slugs allow `-`, not `_`) |
| Marketing site | `https://collectorstunetracker.com` |
| App (prod) | `https://app.collectorstunetracker.com` |
| App (dev) | `https://app.dev.collectorstunetracker.com` |
| OAuth callback (prod / dev) | `https://app.collectorstunetracker.com/api/auth/callback` / `https://app.dev.collectorstunetracker.com/api/auth/callback` |
| Webhook endpoint (prod / dev) | `https://app.collectorstunetracker.com/api/hooks/substratal` / `https://app.dev.collectorstunetracker.com/api/hooks/substratal` |

> ⚠️ **Known blocker on the platform side.** CTT is self-registered, so it **must** use the hosted
> sign-in flow (embedded login returns `403 embedded_login_not_allowed`). The platform's discovery document
> names `https://auth.substratalapps.com/authorize` as the authorization endpoint. As of 2026-11-09 that
> host doesn't respond, and the auth docs say the page "ships with the dashboard". You can finish every step
> below now. **Nobody can sign in to CTT until that page is live.** That's a Substratal backlog item, and
> CTT will not work around it.

---

## 0. Before you start

- [ ] **A working mailbox for `admin-ctt@thrashingcode.com`.** Signing up sends a verification email, and
      only a verified email can register an application. This address is on `thrashingcode.com`, so it doesn't
      depend on the `collectorstunetracker.com` DNS move from Vercel. You can do this guide before or during that move.
- [ ] A password manager entry for the account, and a place to keep three secrets: the **prod API key**, the
      **dev API key**, and the two **webhook signing secrets**. They'll end up in AWS Secrets Manager.
- [ ] `curl` and `jq` installed.
- [ ] A local copy of `brand/logo/png/9.png` (the teal sleeve badge on charcoal), to use as the app icon.

Shell helpers used below:

```bash
API=https://api.substratalapps.com
V="Substratal-Version: 1"
idem() { echo "ctt-setup-$(uuidgen)"; }
```

## 1. Create the managing account

```bash
curl -sS -X POST $API/auth/signup -H "$V" -H "Content-Type: application/json" -d '{
  "email": "admin-ctt@thrashingcode.com",
  "password": "<12–128 chars, from your password manager>",
  "display_name": "Collectors'\'' Tune Tracker"
}' | jq '{user_id, email_verified}'
```

- [ ] Note the `user_id` (`usr_…`).
- [ ] Click the verification link in the email. Self-registering an app with an unverified email returns `403 email_not_verified`.
- [ ] Turn on **MFA**. TOTP: `POST /users/{id}/mfa/totp`, then `…/totp/confirm`; save the recovery codes. A
      passkey also works. This account controls who can reach CTT, so MFA is required.

The account is a role account, not anyone's personal login. Other maintainers get access through the
organization (step 3), never by sharing this password.

## 2. Sign in (get a user token for the rest of the steps)

```bash
LOGIN=$(curl -sS -X POST $API/auth/login -H "$V" -H "Content-Type: application/json" \
  -d '{"email":"admin-ctt@thrashingcode.com","password":"<password>"}')
echo "$LOGIN" | jq '{mfa_required}'
# If mfa_required is true:
TOKEN=$(curl -sS -X POST $API/auth/mfa/verify -H "$V" -H "Content-Type: application/json" \
  -d "{\"mfa_token\":\"$(echo "$LOGIN" | jq -r .mfa_token)\",\"code\":\"<6-digit code>\"}" | jq -r .access_token)
# Otherwise:
# TOKEN=$(echo "$LOGIN" | jq -r .access_token)
AUTH="Authorization: Bearer $TOKEN"
```

Access tokens last about 15 minutes. Repeat this step if a later call returns `401`.

## 3. Create the organization

```bash
curl -sS -X POST $API/organizations -H "$V" -H "$AUTH" -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(idem)" -d '{"name":"Collectors'\'' Tune Tracker"}' | jq '{id, name}'
ORG=org_…   # from the response
```

The managing account becomes the org's first member, with role `org_admin`. Later maintainers can be added
with `POST /organizations/$ORG/members`. Give them `org_admin` only if they should manage the app.

## 4. Register the applications (prod and dev)

Both apps are owned by the **organization**, not the user, so ownership survives staff changes.
`access_tier` starts as `restricted` for the private beta: only people the CTT backend grants get in.
Switch it to `free` at public launch, which lets every Substratal user in.

```bash
cat > /tmp/ctt-app.json <<'JSON'
{
  "slug": "ctt",
  "name": "Collectors' Tune Tracker",
  "description": "The crate-digger's logbook: catalog, photograph, grade, and explore your records, CDs, tapes, and music memorabilia.",
  "launch_url": "https://app.collectorstunetracker.com/",
  "redirect_uris": ["https://app.collectorstunetracker.com/api/auth/callback"],
  "support_url": "https://collectorstunetracker.com/support",
  "email_from_name": "Collectors' Tune Tracker",
  "access_tier": "restricted",
  "owner_organization_id": "REPLACE_ORG",
  "permissions": [
    { "key": "app.ctt.collection.read",   "description": "View your own collections, items, and images." },
    { "key": "app.ctt.collection.write",  "description": "Add and edit collections, items, and images." },
    { "key": "app.ctt.collection.delete", "description": "Delete collections, items, and images." },
    { "key": "app.ctt.catalog.edit",      "description": "Submit edits to the shared music catalog." },
    { "key": "app.ctt.catalog.moderate",  "description": "Review and approve catalog edits." },
    { "key": "app.ctt.admin",             "description": "Operate CTT: imports, maintenance, support tools." }
  ],
  "available_app_roles": ["collector", "curator", "admin"],
  "default_app_role": "collector",
  "settings_schema": {
    "type": "object",
    "properties": {
      "theme_mode":   { "type": "string", "enum": ["system", "light", "dark"], "default": "system" },
      "theme_light":  { "type": "string", "enum": ["cream-sleeve", "photocopy", "newsprint", "riso-day", "gig-flyer"], "default": "cream-sleeve" },
      "theme_dark":   { "type": "string", "enum": ["back-room", "spray-can", "basement-show", "riso-night", "xerox-black"], "default": "back-room" },
      "shelf_view":   { "type": "string", "enum": ["grid", "crate", "list"], "default": "grid" },
      "show_values":  { "type": "boolean", "default": false },
      "currency":     { "type": "string", "pattern": "^[A-Z]{3}$", "default": "USD" },
      "grading_scale":{ "type": "string", "enum": ["goldmine"], "default": "goldmine" },
      "reduce_motion":{ "type": "boolean", "default": false }
    }
  }
}
JSON
sed "s/REPLACE_ORG/$ORG/" /tmp/ctt-app.json | curl -sS -X POST $API/applications -H "$V" -H "$AUTH" \
  -H "Content-Type: application/json" -H "Idempotency-Key: $(idem)" -d @- | jq '{id, review_status}'
```

Then the dev app. It's the same document with these changes:

```bash
sed -e "s/REPLACE_ORG/$ORG/" \
    -e 's/"slug": "ctt"/"slug": "ctt-dev"/' \
    -e "s/\"name\": \"Collectors' Tune Tracker\"/\"name\": \"CTT (dev)\"/" \
    -e 's#app\.collectorstunetracker\.com#app.dev.collectorstunetracker.com#g' \
    -e 's/app\.ctt\./app.ctt-dev./g' \
    /tmp/ctt-app.json > /tmp/ctt-dev-app.json
# Check it: permission keys must start with app.ctt-dev.  (permission keys allow [a-z0-9_.] after the prefix)
jq '.slug, .permissions[].key, .redirect_uris' /tmp/ctt-dev-app.json
curl -sS -X POST $API/applications -H "$V" -H "$AUTH" -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(idem)" -d @/tmp/ctt-dev-app.json | jq '{id, review_status}'
```

- [ ] Both apps return `review_status: "pending_review"`. That's expected: like any customer, they wait in
      Substratal's review queue. Until they're approved they can't be launched or granted (`409 application_not_available`).
- [ ] Registering also creates roles `role_ctt_collector`, `role_ctt_curator`, `role_ctt_admin` (and the `ctt-dev` equivalents), each with no permissions yet.

> Local development (`http://localhost`) redirect URIs are only accepted on a **test-mode** application,
> meaning one created with a test-mode credential. CTT's plan is to use the `app.dev` environment instead. If
> local OAuth turns out to be needed, add a third, test-mode app later.

## 5. Give each role its permissions

```bash
patch_role() { curl -sS -X PATCH $API/roles/$1 -H "$V" -H "$AUTH" -H "Content-Type: application/json" -d "$2" | jq '{id, permissions}'; }

patch_role role_ctt_collector '{"permissions":["app.ctt.collection.read","app.ctt.collection.write","app.ctt.collection.delete","app.ctt.catalog.edit"]}'
patch_role role_ctt_curator   '{"permissions":["app.ctt.collection.read","app.ctt.collection.write","app.ctt.collection.delete","app.ctt.catalog.edit","app.ctt.catalog.moderate"]}'
patch_role role_ctt_admin     '{"permissions":["app.ctt.collection.read","app.ctt.collection.write","app.ctt.collection.delete","app.ctt.catalog.edit","app.ctt.catalog.moderate","app.ctt.admin"]}'
```

- [ ] Repeat for the `ctt-dev` roles (`role_ctt-dev_collector` and so on, with `app.ctt-dev.*` keys).

## 6. Upload the app icon

Use the application icon-upload flow (`POST /applications/{id}/icon/uploads` → upload to the returned
presigned target → `POST …/uploads/{uploadId}/complete`) with `brand/logo/png/9.png`, for both apps. The exact
fields are in `substratalapps.com/docs/api-reference/applications.md` → *Icon uploads*.

## 7. Create the backend API keys

One key per environment, scoped to that app. The secret is shown **once**.

```bash
curl -sS -X POST $API/api-keys -H "$V" -H "$AUTH" -H "Content-Type: application/json" -H "Idempotency-Key: $(idem)" -d '{
  "name": "ctt-backend-prod", "scope": "app_ctt", "mode": "live", "intended_use": "service",
  "permissions": ["entitlements.manage", "users.list"]
}' | jq '{id, secret}'
# and: "name": "ctt-backend-dev", "scope": "app_ctt-dev"
```

- [ ] Store each `secret` (`satk_live_…`) in your password manager. CTT's Terraform will create
      `ctt/prod/substratal-api-key` and `ctt/dev/substratal-api-key` in Secrets Manager for you to paste them into.
- [ ] Optional: a `"mode": "test"` key for `app_ctt-dev`, for automated integration tests with throwaway test users.
- Keys for sending notifications come later (Phase 4). Add those permissions when that work starts.

## 8. Subscribe to webhooks

The platform requires every app to subscribe to `access.revoked` and `role.removed`. CTT also listens for
`user.deleted`, which triggers a purge of that user's CTT data, and `application.review_status_changed`.

```bash
curl -sS -X POST $API/webhooks -H "$V" -H "$AUTH" -H "Content-Type: application/json" -H "Idempotency-Key: $(idem)" -d '{
  "scope": "app_ctt",
  "url": "https://app.collectorstunetracker.com/api/hooks/substratal",
  "events": ["access.revoked", "role.removed", "access.granted", "role.assigned", "user.deleted", "user.suspended", "application.review_status_changed"],
  "description": "CTT prod: session kill and erasure"
}' | jq '{id, signing_secret, status}'
```

- [ ] Repeat with `scope: app_ctt-dev` and the `app.dev` URL.
- [ ] Store each `signing_secret` (`whsec_…`). It's never shown again; use `rotate-secret` if it's lost.
- The URL must resolve to a public IP **at creation time**. If the CTT endpoint isn't deployed yet, do this step
  after Phase 0 deploys the webhook Lambda. Use `POST /webhooks/{id}/test` to confirm delivery.

## 9. After approval: grant yourself access

Once both apps show `review_status: "approved"` (`GET /applications?owned=true`):

```bash
ME=usr_…   # your user_id from step 1
curl -sS -X POST $API/users/$ME/entitlements -H "$V" -H "$AUTH" -H "Content-Type: application/json" \
  -H "Idempotency-Key: ctt-founder-grant-$ME" -d '{"application_id":"app_ctt","source":"admin_grant"}'
curl -sS -X POST $API/users/$ME/roles/role_ctt_admin -H "$V" -H "$AUTH"
```

Beta testers get the same entitlement call (without the admin role). The CTT backend will automate this later.

## 10. Hand-off checklist (share these with the CTT build)

| Item | Where it goes |
|---|---|
| `ORG` id | `infra/terraform/envs/*/terraform.tfvars` (`substratal_org_id`) |
| `app_ctt`, `app_ctt-dev` | tfvars (`substratal_app_id`) |
| API key secrets | Secrets Manager `ctt/{env}/substratal-api-key` |
| Webhook signing secrets | Secrets Manager `ctt/{env}/substratal-webhook-secret` |
| Webhook ids | tfvars (for runbooks) |
| Review status | ✅ approved / ⏳ pending |
| Hosted sign-in page live at `auth.substratalapps.com` | ✅ / ⏳ (**blocks login**) |

Nothing secret goes in git. The tfvars hold only ids.
