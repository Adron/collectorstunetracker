# 05 — Consolidation & Build Plan

> Status: **Draft v0.2** · 2026-11-12 · Goal: one repo, built fresh, that **entirely replaces** the current
> CRA/Next hybrid prototype and the separate `collectorstunetracker_db` repo — keeping the brand and vibe.

## 1. What exists today (audit)

| Where | What | Assessment |
|---|---|---|
| `main` — `src/` | Create React App + react-router; Login/Dashboard/Collections/About stubs; no styling beyond CRA defaults | Throwaway. Broken by design: a Next.js API route (`src/pages/api/login.ts`) inside a CRA app never runs; user object stored in `localStorage`; `App.test.js` tests for "learn react" text that doesn't exist. |
| `main` — `src/db.ts` | Kysely + `@vercel/postgres` with a `users` table | Replaced by Substratal identity + the new Next.js app on Neon. |
| `main` — `package.json` | CRA 5 (deprecated), Next 14, Vercel analytics/postgres, bcryptjs | All removed. |
| `main` — `public/` | CRA default icons/manifest ("React App") | Replaced with brand icons/manifest. |
| `main` — `.gitignore` | Two ignore files concatenated (Gradle/Java + CRA) | Rewritten for the pnpm/Turborepo monorepo. |
| `main` — `LICENSE` | Was empty | ✅ Now proprietary (Q5). |
| branch `collectors_tracker_docs` | Logo system (14 PNG, 12 JPG, 9 GIF, banners) + README for GitHub Pages | **Kept** — copied into `/brand/logo`. Basis for [02](02-brand-and-design.md). |
| branch `adding-project-skeleton-defaults` | Spring Boot/Gradle skeleton, Flyway-style migrations, committed `.gradle/` and `build/` output | Superseded. Migrations are the same as the DB repo's (minus `email`). |
| branch `release` | Initial commit + ignore | Empty. |
| repo `collectorstunetracker_db` | Postgres schemas `the_system` (tenants/users/roles/user_roles) + empty `the_collections`; seed with plaintext root password; docker-compose with password in file; Go `main.go` placeholder | **Imported** with full history into `/legacy/database` via `git subtree`. Design superseded by [03](03-domain-and-data-model.md). |

## 2. Consolidation steps

| # | Step | Status |
|---|---|---|
| C1 | Create branch `replatform/spec-and-db-consolidation` | ✅ done |
| C2 | `git subtree add --prefix=legacy/database` from `collectorstunetracker_db@main` (history preserved) | ✅ done |
| C3 | Copy logo assets from `collectors_tracker_docs` into `/brand/logo` | ✅ done |
| C4 | Spec docs `/docs/spec/01–09`, runbooks, README | ✅ done |
| C5 | Delete GitHub repo `Adron/collectorstunetracker_db` (Q3) | ⏳ needs a `gh` token with `delete_repo` scope, or delete it on GitHub |
| C6 | Remove the CRA prototype (`src/`, `public/`, `package*.json`) | ✅ done (Phase 0) |
| C7 | Delete branches `adding-project-skeleton-defaults` and `release` | ⏳ you: `git push origin --delete adding-project-skeleton-defaults release` |
| C7b | Delete `collectors_tracker_docs` once the new marketing site is live | ⏳ Phase 0 exit |
| C8 | Delete `legacy/` once the new schema is in production | ⏳ Phase 3 |
| C9 | `LICENSE` → proprietary | ✅ done |
| C10 | Theme lab: 5 dark + 5 light themes (`design/themes`) | ✅ done, approved |
| C11 | Fix the stuck Vercel purchase of `collectorstunetracker.com` ([08 §5](08-hosting-costs-and-scaling.md#5-domain-collectorstunetrackercom)) | ⏳ you |
| C12 | Substratal onboarding ([setup-on-substratal.md](../setup-on-substratal.md)) | ⏳ you |
| C13 | Merge this branch into `main` (via PR) before the Phase 0 scaffold starts | ⏳ |

## 3. Phased build (Vercel + Neon)

Every phase deploys to Vercel previews on each PR and to production on merge. Each phase has GitHub issues under a
matching milestone.

### Phase 0 — Foundations (≈1–1½ weeks)
- Turborepo + npm workspaces monorepo per [04 §4](04-architecture.md#4-repository--projects); remove the CRA prototype.
- Vercel projects `ctt-site` and `ctt-app` in `ctt-a-team`; Neon integration (Free, `us-east-1`, preview branches);
  Blob store; environment variables; `CRON_SECRET`.
- CI (GitHub Actions): lint, typecheck, Vitest, Playwright + axe against previews, migrations against Postgres 16 in Docker.
- **Theme system** ([#7](https://github.com/Adron/collectorstunetracker/issues/7): System / Light / Dark with per-mode theme choice, no flash), fonts, app shell, `RansomTitle`, XX face,
  empty states, 404, favicons and PWA icons from the sleeve badge.
- Marketing site at `collectorstunetracker.com` with **Log in** → `app.`.
- Auth: Substratal PKCE login/callback/logout, database sessions, webhook endpoint; local mock of the authorize/token endpoints.
- **Exit:** themed app shell on `app.` (mock login until Q16 clears), marketing site live.

### Phase 1 — Collect (≈2–3 weeks)
- Migrations: `collector`, `collection`, `item_group` (nested), `item`, `item_condition`, `location`, `tag`, `format` (seeded), `item_image`, `app.job`.
- Collections and nested groups (create, rename, reorder, move, archive); items of every kind (album, single, EP, box set,
  tape, CD, digital, memorabilia, merch, gear); Goldmine grading; provenance; public/private notes.
- Images: client upload to Blob, sharp processing job, `/media` delivery route, typed capture flow.
- Shelf grid, crate and list views; filters and sort; the item "sleeve" page.
- **Exit:** a collector can catalog 100 items with photos, organized in groups, on phone and desktop.

### Phase 2 — Visibility & sharing (≈1½–2 weeks)
- Profile master switch + collection/group/item visibility with inheritance; `effective_visibility` maintenance; the
  `public_item_v` read model; unlisted tokens.
- Visibility UI: effective-state badges with reasons, "this will show N items" confirmations, bulk changes.
- Public pages (`/@handle`, collection, group, item, crate) with ISR, cache-tag revalidation, JSON-LD, OG images.
- Crates and wants.
- **Exit:** privacy test suite passes (no private field or private item is reachable by any public route, cached or not).

### Phase 3 — Import, export & identify (≈2–3 weeks) → **private beta launch**
- Exports: CTT JSON, Discogs CSV, full CSV, JSON-LD, full archive zip (background job, signed link).
- Imports: Discogs CSV, generic CSV with mapping, CTT JSON/archive; dry run, matching, duplicate handling; resumable jobs.
- Catalog tables (lazy) + MusicBrainz lookup + Cover Art Archive fallback; barcode scan; "pick your pressing".
- Search (`tsvector` + `pg_trgm`).
- Nightly database backup to Blob; spend alerts.
- **Exit:** private beta on `app.collectorstunetracker.com`.

### Phase 4 — Sell & trade (≈1½–2 weeks)
- Listings (sale / trade / both), snapshots, status flow, expiry; Market page with filters; seller listings on profiles.
- Conversations and messages; email notifications via Resend (push later, with mobile); reporting and a moderation queue; rate limits; the
  unofficial-items rule.
- Terms of service and listing rules pages.
- **Exit:** public launch candidate.

### Phase 5 — Beyond records & the graph
- Events, venues, setlists, show history; signatures/COA; loans; listening log.
- Explore pages, credits graph, rabbit-hole navigation; catalog edits + curator moderation.
- Discogs account sync (OAuth), CLZ/MusicBuddy templates; OCR assist; offline capture queue.

### Later
Payments (Stripe Connect), offers and feedback, native apps, valuation feeds, shop/club organizations, and the AWS
moves in [08 §4](08-hosting-costs-and-scaling.md#4-when-to-move-what) as traffic warrants.

## 4. Definition of done (every phase)
- Unit tests for `packages/core` (visibility, importers, exporters) and integration tests against Postgres 16 with RLS on.
- Playwright e2e for the phase's main flow in **one light and one dark theme**; axe scan clean; contrast tests pass.
- Privacy tests for anything that touches public routes.
- Preview deployment reviewed; migrations applied cleanly on a Neon branch.
- Brand review against [02](02-brand-and-design.md): tokens only, no stray hex values.

## 5. Risks

| Risk | Mitigation |
|---|---|
| Substratal hosted sign-in page not live (Q16) | Build against a mock; real login is a config switch |
| Vercel ruling image traffic ineligible for flat-rate CDN | Budget for on-demand ([08 §3](08-hosting-costs-and-scaling.md#3-cost-scenarios)); `MediaStore` lets images move to S3 + CloudFront |
| Neon Free limits (1 GB, 100 CU-hours) | Lazy catalog, usage alerts, upgrade to Launch at 70% |
| Privacy leak through caching | Synchronous revalidation on visibility decreases; privacy test suite; private images never get `public` cache headers |
| Marketplace abuse or legal exposure | No payments in v1, verified sellers, reports and moderation, no sale of unofficial items, clear terms |
| Catalog data licensing (Discogs, cover art) | MusicBrainz-first; references and attribution; no bulk-copying Discogs images |
| Ransom-note aesthetic hurting usability | Limited to heroes and empty states; contrast tests in CI |
