# 05 — Consolidation & Build Plan

> Status: **Draft v0.1** · 2026-11-09 · Goal: one repo, built fresh, that **entirely replaces** the current
> CRA/Next hybrid prototype and the separate `collectorstunetracker_db` repo — keeping the brand and vibe.

## 1. What exists today (audit)

| Where | What | Assessment |
|---|---|---|
| `main` — `src/` | Create React App + react-router; Login/Dashboard/Collections/About stubs; no styling beyond CRA defaults | Throwaway. Broken by design: a Next.js API route (`src/pages/api/login.ts`) inside a CRA app never runs; user object stored in `localStorage`; `App.test.js` tests for "learn react" text that doesn't exist. |
| `main` — `src/db.ts` | Kysely + `@vercel/postgres` with a `users` table | Replaced by Substratal identity + Go API. |
| `main` — `package.json` | CRA 5 (deprecated), Next 14, Vercel analytics/postgres, bcryptjs | All removed. |
| `main` — `public/` | CRA default icons/manifest ("React App") | Replaced with brand icons/manifest. |
| `main` — `.gitignore` | Two ignore files concatenated (Gradle/Java + CRA) | Rewritten for Go + Node + Terraform. |
| `main` — `LICENSE` | **Empty file** | Needs a decision (Q5). |
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
| C4 | Write spec docs `/docs/spec/01–06` and new README | ✅ done (this PR) |
| C5 | Delete GitHub repo `Adron/collectorstunetracker_db` (decided Q3). Branch with its history is pushed. | ⏳ blocked: `gh` token lacks `delete_repo` scope |
| C6 | Remove the CRA/Next prototype (`src/`, `public/`, `package*.json`) once Phase 0 scaffolding lands | ⏳ Phase 0 |
| C7 | Delete branches `adding-project-skeleton-defaults` and `release` | ⏳ you: `git push origin --delete adding-project-skeleton-defaults release` |
| C7b | Delete `collectors_tracker_docs` once the new marketing site is live on `collectorstunetracker.com` | ⏳ Phase 1 |
| C9 | `LICENSE` → proprietary | ✅ done |
| C10 | DNS to Route 53, then registrar transfer from Vercel ([setup-domain-on-aws.md](../setup-domain-on-aws.md)) | ⏳ you, Phase 0 |
| C11 | Substratal onboarding ([setup-on-substratal.md](../setup-on-substratal.md)) | ⏳ you, Phase 0 |
| C8 | Delete `legacy/` once the new schema has shipped to prod (history stays in git) | ⏳ Phase 3 |

## 3. Phased build

Each phase ends deployable to `dev`; phases 2+ also to `prod`.

### Phase 0 — Foundations (≈1–2 weeks)
- Monorepo scaffolding per [04 §9](04-architecture.md#9-repository-layout-target): Go module, `apps/web` (Vite + React 19 + TS), `api/openapi.yaml`, `db/`, `infra/terraform/`.
- Terraform bootstrap: state, GitHub OIDC role, `dev` env: CloudFront + S3 web, HTTP API + `api`/`bff` Lambdas, `ctt` database + roles in the shared Aurora cluster (bootstrap SQL, Data API), CI against stock `postgres:17`.
- Route 53 hosted zone for `collectorstunetracker.com` (records imported from Vercel), ACM certs, CloudFront for apex/`www` (site) and `app.` (app).
- Substratal customer onboarding, done by hand following [setup-on-substratal.md](../setup-on-substratal.md): the `admin@collectorstunetracker.com` account, the **Collectors' Tune Tracker** org, and `app_ctt` / `app_ctt-dev` through Substratal review like any customer.
- BFF login/logout/refresh with hosted PKCE; JWT verification middleware; RLS `SET LOCAL` plumbing.
- Design tokens (`tokens.css`), fonts, app shell, sleeve-badge favicon/PWA icons, `<RansomTitle>`, empty states, 404.
- CI: Go test/lint, web typecheck/test, `terraform plan` on PR.
- `apps/site`: first cut of the marketing page at `collectorstunetracker.com` (zine hero, what CTT is, **Log in** → `app.`).
- **Exit:** sign in with Substratal → see an empty, on-brand shelf on `app.dev`. *(Depends on Q16: the hosted sign-in page must be live. Until it is, the exit is "PKCE flow passes against a contract-level mock".)*

### Phase 1 — Collect (MVP core) (≈3–4 weeks)
- Migrations: `format` (seeded), `collection`, `item`, `item_condition`, `location`, `tag`, `item_image`.
- CRUD API + UI: collections, items (free-form, no catalog yet), Goldmine grading, locations, tags.
- **Images:** presigned upload, image-worker (renditions, EXIF strip), CloudFront signed cookies, capture flow with typed steps.
- Shelf grid/list views, filters, sort; item "sleeve" detail page.
- Export (CSV/JSON).
- **Exit:** a collector can catalog 100 records with photos, entirely by hand, on phone and desktop.

### Phase 2 — Catalog & Identify (≈4 weeks)
- Catalog tables (party, work, release, medium, track, credit, label, identifier) + `external_ref`, `lookup_cache`.
- MusicBrainz lookup + Cover Art Archive fallback; barcode scanning; text/cat# search; "pick your pressing" compare UI.
- Discogs CSV import with dry run + match review; generic CSV import.
- Search (`tsvector` + `pg_trgm`) across own items + catalog.
- **First prod launch (private beta).**

### Phase 3 — Beyond records (≈3 weeks)
- Memorabilia, print, apparel, gear kinds; events, venues, lineups, setlists; show history.
- Signatures/COA; loans; listening log; want list; crates.
- Public/unlisted shelves (zine-styled public page).
- Remove `legacy/`.

### Phase 4 — The Graph & polish (≈4 weeks)
- Relationship edges, Explore pages (artist/person/label/event), rabbit-hole navigation with breadcrumb trail.
- Catalog edit submissions + moderation (curator role).
- Stats dashboards; notifications via Substratal (loan due, import done, want found).
- OCR assist for runout/label photos.
- Offline capture queue (background sync).

### Later
Native apps (reuse API; Substratal SwiftUI/Compose shells), valuation feeds, shop/club orgs, marketplace, Bedrock-generated "liner notes" summaries from the graph.

## 4. Definition of done (every phase)
- OpenAPI updated and codegen clean; Go unit tests + API integration tests against a real Postgres (Docker) with RLS on.
- Playwright e2e for the phase's main flow; axe accessibility scan clean; contrast tests pass against tokens.
- Terraform applied to `dev` from CI; runbook notes for any new alarm.
- Brand review: screens checked against [02](02-brand-and-design.md) (tokens only, no stray hex values).

## 5. Risks
| Risk | Mitigation |
|---|---|
| Catalog data licensing (Discogs, cover art) | MusicBrainz-first; store references + attribution; legal check before public launch |
| HEIC/libvips packaging on Lambda | Container image; fallback to Node `sharp` |
| Shared Aurora cluster coupling with Substratal | Separate DB roles/schema now; documented path to a dedicated cluster |
| Data API limits (1 MB result, latency) | Cursor pagination, narrow selects; reassess with RDS Proxy + VPC if needed |
| Ransom-note aesthetic hurting usability | Strictly limited to heroes/empty states; tokens + contrast tests in CI |
