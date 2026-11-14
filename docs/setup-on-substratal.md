# Setting up CTT on Substratal Apps

Run this guide by hand, once, to register **Collectors' Tune Tracker** on the Substratal Apps platform as a
customer would. It uses only the public API at `https://api.substratalapps.com`. There are no staff permissions,
no concierge steps, and no database access. Request shapes follow the platform docs in
`substratalapps.com/docs/api-reference/` (applications, organizations, webhooks, api-keys, auth).

| Thing | Value |
|---|---|
| Managing account | `admin-ctt@thrashingcode.com` |
| Organization | **Collectors' Tune Tracker** |
| Application | slug `collectors-tune-tracker` → `app_collectors-tune-tracker` (production only; see *Why there's no dev app*) |
| Marketing site | `https://collectorstunetracker.com` |
| App | `https://app.collectorstunetracker.com` |
| OAuth callback | `https://app.collectorstunetracker.com/api/auth/callback` |
| Webhook endpoint | `https://app.collectorstunetracker.com/api/hooks/substratal` |

### Why there's no dev app

CTT registers **one** application, production. Vercel previews and local dev don't get their own:

- **Redirect URIs are exact matches** (at most 10, no wildcards). Every Vercel preview gets a new URL, so
  previews can't be registered. A dev app would only help a fixed staging URL, and CTT doesn't have one.
- `http://localhost` redirects are only allowed on a **test-mode** application, not a normal dev app.
- Previews and local dev sign in through CTT's **local auth mock**, which they'd need anyway while the hosted
  sign-in page is down (below).

If CTT later gets a fixed staging URL, or needs real sign-in on localhost, register a second app then
(slug `collectors-tune-tracker-staging`, or a test-mode app for localhost) and give it its own key and webhook.

## Status

| Step | State |
|---|---|
| 0–3 Account, sign-in, organization | ⏭️ Not needed: the app is owned by `adronhall@proton.me` (see step 4) |
| 4 Register the application | ✅ Registered 2026-11-12, approved, `restricted` |
| 5 Role permissions | ✅ 2026-11-14 |
| 6 Icon | ✅ Uploaded through the dashboard, 2026-11-14 |
| — Support URL | ✅ `/support` page on the marketing site (`apps/site/app/support`) |
| 7 Backend API key | ✅ `ctt-backend-prod`, in Vercel `ctt-app` as `SUBSTRATAL_API_KEY` (Production), 2026-11-14 |
| 8 Webhook | ⏸️ Waits for the `/api/hooks/substratal` route to be deployed |
| 9 Grant yourself access | ✅ `ent_01M7CS635VZ7YFNMS1Z4Y1VPJG` (`admin_grant`) + `role_collectors-tune-tracker_admin`, 2026-11-14 |
| Hosted sign-in page | ⛔ `auth.substratalapps.com` still doesn't respond (checked 2026-11-14) |

> ⚠️ **Known blocker on the platform side.** CTT is self-registered, so it **must** use the hosted
> sign-in flow (embedded login returns `403 embedded_login_not_allowed`). The platform's discovery document
> names `https://auth.substratalapps.com/authorize` as the authorization endpoint. As of 2026-11-09 that
> host doesn't respond (still true on 2026-11-14), and the auth docs say the page "ships with the dashboard". You can finish every step
> below now. **Nobody can sign in to CTT until that page is live.** That's a Substratal backlog item, and
> CTT will not work around it.

---

## 0. Before you start

- [ ] **A working mailbox for `admin-ctt@thrashingcode.com`.** Signing up sends a verification email, and
      only a verified email can register an application. This address is on `thrashingcode.com`, so it doesn't
      depend on `collectorstunetracker.com` (whose purchase at Vercel hasn't completed yet).
- [ ] A password manager entry for the account, and a place to keep two secrets: the **API key** and the
      **webhook signing secret**. They'll end up in the `ctt-app` project's Vercel environment variables.
- [ ] `curl` and `jq` installed.
- [ ] The app icon: `apps/web/public/brand/icons/app-icon-dark-512.png` (square, 41 KB; the limit is 1 MB).

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

## 4. Register the application

> The production app was registered through the dashboard's **Register application** form on 2026-11-12, with
> slug `collectors-tune-tracker`. Slugs can't be changed, so every id below uses it. The form's fields match the
> JSON here: Launch URL, Redirect URIs, Support URL, Email sender name, Access tier, and the Settings schema
> (paste the `settings_schema` object). The JSON below is the record of what it should hold, and works with
> `PATCH /applications/app_collectors-tune-tracker` to correct anything the form got wrong.

> **As registered, the app is owned by a user, not an organization.** It was registered from the dashboard while
> signed in as `adronhall@proton.me` (`usr_01M5DMKYH254JGYKDWEY1PEJ5T`), so `owner_user_id` is set and
> `owner_organization_id` is `null`. A customer can't change an app's owner, and a live app can't be deleted or
> re-slugged, so it stays that way. Sign in as that account for every step below. The `admin-ctt@` role account and
> the CTT organization (steps 1–3) aren't needed for now.

The plan was for the app to be owned by the **organization**, not a user, so ownership would survive staff changes.
`access_tier` starts as `restricted` for the private beta: only people the CTT backend grants get in.
Switch it to `free` at public launch, which lets every Substratal user in. The `/support` page on the marketing
site isn't built yet, so the registered `support_url` returns 404 until it ships. `support_url` must be `https://`;
a `mailto:` link is rejected with `invalid_format`. If the page isn't coming soon, set the field to `null`.

```bash
cat > /tmp/ctt-app.json <<'JSON'
{
  "slug": "collectors-tune-tracker",
  "name": "Collectors' Tune Tracker",
  "description": "The crate-digger's logbook. Catalog the records, CDs, tapes, posters and ticket stubs you own: photograph, grade and value each piece. Then follow the artists, labels and pressings that connect your collection.",
  "launch_url": "https://app.collectorstunetracker.com/",
  "redirect_uris": ["https://app.collectorstunetracker.com/api/auth/callback"],
  "support_url": "https://collectorstunetracker.com/support",
  "email_from_name": "Collectors' Tune Tracker",
  "access_tier": "restricted",
  "owner_organization_id": "REPLACE_ORG",
  "permissions": [
    { "key": "app.collectors-tune-tracker.collection.read",   "description": "View your own collections, items, and images." },
    { "key": "app.collectors-tune-tracker.collection.write",  "description": "Add and edit collections, items, and images." },
    { "key": "app.collectors-tune-tracker.collection.delete", "description": "Delete collections, items, and images." },
    { "key": "app.collectors-tune-tracker.catalog.edit",      "description": "Submit edits to the shared music catalog." },
    { "key": "app.collectors-tune-tracker.catalog.moderate",  "description": "Review and approve catalog edits." },
    { "key": "app.collectors-tune-tracker.admin",             "description": "Operate CTT: imports, maintenance, support tools." }
  ],
  "available_app_roles": ["collector", "curator", "admin"],
  "default_app_role": "collector",
  "settings_schema": {
    "type": "object",
    "properties": {
      "theme_mode":   { "type": "string", "title": "Theme mode", "enum": ["system", "light", "dark"], "default": "system" },
      "theme_light":  { "type": "string", "title": "Light theme", "enum": ["cream-sleeve", "photocopy", "newsprint", "riso-day", "gig-flyer"], "default": "cream-sleeve" },
      "theme_dark":   { "type": "string", "title": "Dark theme", "enum": ["back-room", "spray-can", "basement-show", "riso-night", "xerox-black"], "default": "back-room" },
      "shelf_view":   { "type": "string", "title": "Shelf view", "enum": ["grid", "crate", "list"], "default": "grid" },
      "show_values":  { "type": "boolean", "title": "Show item values", "default": false },
      "currency":     { "type": "string", "title": "Currency", "pattern": "^[A-Z]{3}$", "default": "USD" },
      "grading_scale":{ "type": "string", "title": "Grading scale", "enum": ["goldmine"], "default": "goldmine" },
      "reduce_motion":{ "type": "boolean", "title": "Reduce motion", "default": false }
    }
  }
}
JSON
sed "s/REPLACE_ORG/$ORG/" /tmp/ctt-app.json | curl -sS -X POST $API/applications -H "$V" -H "$AUTH" \
  -H "Content-Type: application/json" -H "Idempotency-Key: $(idem)" -d @- | jq '{id, review_status}'
```

- [ ] Check `review_status` (`GET /applications?owned=true`). The dashboard form says self-registered apps
      are approved as soon as they're registered. If it comes back `pending_review` instead, it can't be launched or granted until it's
      approved (`409 application_not_available`).
- [ ] Registering also creates roles `role_collectors-tune-tracker_collector`, `role_collectors-tune-tracker_curator`, `role_collectors-tune-tracker_admin`, each with no permissions yet.

## 5. Give each role its permissions

> **The dashboard form doesn't set `permissions` or `available_app_roles`**, so an app registered there starts with
> no roles. Add both with `PATCH /applications/app_collectors-tune-tracker` (the `permissions`,
> `available_app_roles` and `default_app_role` fields from the JSON in step 4). That creates the three empty roles.
> Done 2026-11-14: collector 4, curator 5, admin 6 permissions.

```bash
patch_role() { curl -sS -X PATCH $API/roles/$1 -H "$V" -H "$AUTH" -H "Content-Type: application/json" -d "$2" | jq '{id, permissions}'; }

patch_role role_collectors-tune-tracker_collector '{"permissions":["app.collectors-tune-tracker.collection.read","app.collectors-tune-tracker.collection.write","app.collectors-tune-tracker.collection.delete","app.collectors-tune-tracker.catalog.edit"]}'
patch_role role_collectors-tune-tracker_curator   '{"permissions":["app.collectors-tune-tracker.collection.read","app.collectors-tune-tracker.collection.write","app.collectors-tune-tracker.collection.delete","app.collectors-tune-tracker.catalog.edit","app.collectors-tune-tracker.catalog.moderate"]}'
patch_role role_collectors-tune-tracker_admin     '{"permissions":["app.collectors-tune-tracker.collection.read","app.collectors-tune-tracker.collection.write","app.collectors-tune-tracker.collection.delete","app.collectors-tune-tracker.catalog.edit","app.collectors-tune-tracker.catalog.moderate","app.collectors-tune-tracker.admin"]}'
```

## 6. Upload the app icon

**Upload the file. Don't set Icon URL.** Substratal's own clients (the Apps Hub included) only show icons hosted
at `assets.substratalapps.com`, so an external URL like `https://collectorstunetracker.com/icon.png` shows as a
broken image even once that domain works. Today the domain doesn't resolve at all, because its purchase never completed.

In the dashboard, clear **Icon URL** and upload `apps/web/public/brand/icons/app-icon-dark-512.png`. With the API:

```bash
APP=app_collectors-tune-tracker
ICON=apps/web/public/brand/icons/app-icon-dark-512.png
UP=$(curl -sS -X POST $API/applications/$APP/icon/uploads -H "$V" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"content_type\":\"image/png\",\"content_length\":$(stat -f%z $ICON)}")
# Send the file straight to storage: every returned field, then the file last.
curl -sS -X POST "$(echo "$UP" | jq -r .url)" \
  $(echo "$UP" | jq -r '.fields | to_entries[] | "-F \(.key)=\(.value)"') -F "file=@$ICON" -w '%{http_code}\n'   # 204 = stored
curl -sS -X POST $API/applications/$APP/icon/uploads/$(echo "$UP" | jq -r .id)/complete -H "$V" -H "$AUTH" | jq .icon_url
```

- [ ] `icon_url` now starts with `https://assets.substratalapps.com/apps/app_collectors-tune-tracker/`.

## 7. Create the backend API keys

One key, scoped to the app. The secret is shown **once**.

```bash
curl -sS -X POST $API/api-keys -H "$V" -H "$AUTH" -H "Content-Type: application/json" -H "Idempotency-Key: $(idem)" -d '{
  "name": "ctt-backend-prod", "scope": "app_collectors-tune-tracker", "mode": "live", "intended_use": "service",
  "permissions": ["entitlements.manage", "users.list"]
}' | jq '{id, secret}'
```

- [ ] Store the `secret` (`satk_live_…`) in your password manager, then add it to the `ctt-app` Vercel project
      as `SUBSTRATAL_API_KEY` (Production environment only).
- [ ] Optional: a `"mode": "test"` key for automated integration tests with throwaway test users.
- Keys for sending notifications come later (Phase 4). Add those permissions when that work starts.

## 8. Subscribe to webhooks

The platform requires every app to subscribe to `access.revoked` and `role.removed`. CTT also listens for
`user.deleted`, which triggers a purge of that user's CTT data, and `application.review_status_changed`.

```bash
curl -sS -X POST $API/webhooks -H "$V" -H "$AUTH" -H "Content-Type: application/json" -H "Idempotency-Key: $(idem)" -d '{
  "scope": "app_collectors-tune-tracker",
  "url": "https://app.collectorstunetracker.com/api/hooks/substratal",
  "events": ["access.revoked", "role.removed", "access.granted", "role.assigned", "user.deleted", "user.suspended", "application.review_status_changed"],
  "description": "CTT prod: session kill and erasure"
}' | jq '{id, signing_secret, status}'
```

- [ ] Store the `signing_secret` (`whsec_…`) and add it to Vercel as `SUBSTRATAL_WEBHOOK_SECRET` (Production).
      It's never shown again; use `rotate-secret` if it's lost.
- **Wait for this step.** The URL must resolve to a public IP **at creation time**, so it needs the domain
  registered, `app.collectorstunetracker.com` attached to `ctt-app`, and the `/api/hooks/substratal` route
  deployed. Then use `POST /webhooks/{id}/test` to confirm delivery.

## 9. After approval: grant yourself access

Once the app shows `review_status: "approved"` (`GET /applications?owned=true`):

```bash
ME=usr_01M5DMKYH254JGYKDWEY1PEJ5T   # the app owner (adronhall@proton.me); check it's set: echo $ME
curl -sS -X POST $API/users/$ME/entitlements -H "$V" -H "$AUTH" -H "Content-Type: application/json" \
  -H "Idempotency-Key: ctt-founder-grant-$ME" -d '{"application_id":"app_collectors-tune-tracker","source":"admin_grant"}'
curl -sS -X POST $API/users/$ME/roles/role_collectors-tune-tracker_admin -H "$V" -H "$AUTH"
```

Beta testers get the same entitlement call (without the admin role). The CTT backend will automate this later.

## 10. Hand-off checklist (share these with the CTT build)

| Item | Value / where it goes |
|---|---|
| Owner | `usr_01M5DMKYH254JGYKDWEY1PEJ5T` (`adronhall@proton.me`), user-owned |
| Application id | `app_collectors-tune-tracker` → Vercel env `SUBSTRATAL_APP_ID` |
| API key secret | ✅ Vercel env `SUBSTRATAL_API_KEY` (Production) |
| Webhook signing secret | Vercel env `SUBSTRATAL_WEBHOOK_SECRET` (Production) |
| Webhook id | `wh_…` (record here) |
| Review status | ✅ approved (`restricted` tier), checked 2026-11-13 |
| Roles and permissions | ✅ collector / curator / admin, set 2026-11-14 |
| Icon uploaded to `assets.substratalapps.com` | ✅ 2026-11-14 |
| Hosted sign-in page live at `auth.substratalapps.com` | ✅ / ⏳ (**blocks login**) |

Nothing secret goes in git.
