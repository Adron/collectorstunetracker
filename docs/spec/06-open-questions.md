# 06 — Open Questions

> Each question has a **working assumption** so work can proceed; answers update the spec.
>
> **Decided 2026-11-09:** Q1 → Postgres, `ctt` schema in the shared Substratal Aurora cluster · Q3 → **delete** the DB repo (after history is pushed here) · Q4 → free in v1, quotas only, decide billing later · Q11 → Go.

| # | Question | Working assumption |
|---|---|---|
| **Q1** | **Database engine** — you said "determine later." OK to proceed with Postgres (Aurora Serverless v2) as the working target? Shared Substratal cluster with a `ctt` schema, or a dedicated cluster from day one? | ✅ **Decided:** Postgres (Aurora Serverless v2), `ctt` schema in the shared Substratal cluster. |
| **Q2** | Is there **any real data** in a deployed instance of the legacy `the_system` schema (or the Vercel Postgres the prototype pointed at) that must be migrated? | No — design migration only. |
| **Q3** | Archive or delete the GitHub repo **`Adron/collectorstunetracker_db`**? Its history is now preserved in `/legacy/database`. | ✅ **Decided:** delete, after the consolidation branch is pushed. |
| **Q4** | Will CTT **charge** (e.g. storage tiers for images, pro features)? The Substratal platform's billing only covers its own plans, so CTT billing would be CTT's own Stripe integration. | ✅ **Decided:** free in v1 with storage quotas; billing decided later. |
| **Q5** | `LICENSE` is an **empty file**. Open source (MIT/Apache-2.0/AGPL) or proprietary? | Leave as-is until you decide; flagged. |
| **Q6** | Fate of branches `adding-project-skeleton-defaults` (Spring Boot), `release` (empty), and `collectors_tracker_docs` (GitHub Pages)? | Delete the first two after merge; keep `collectors_tracker_docs` until a new landing page ships. |
| **Q7** | Should CTT **adopt Substratal Hub themes** (Moss Paper / Forest Floor etc.) or keep its own punk-zine identity and only honor the light/dark bit of the `sub_theme` cookie? | Own identity; honor light/dark only. |
| **Q8** | Image worker: **Go + libvips** (consistent with the platform, harder packaging) or **Node + sharp** (easier HEIC/AVIF, second language)? | Go + libvips in a Lambda container image; switch if packaging costs > 2 days. |
| **Q9** | **Domain**: `collectorstunetracker.com`, `ctt.substratalapps.com`, something else? Do you own any of these already? | `ctt.substratalapps.com` for dev/beta. |
| **Q10** | Is CTT a **first-party (staff-created)** Substratal app? It changes nothing technically under the plan (hosted PKCE either way), but affects registration and review. | First-party, registered via script, still uses hosted PKCE. |
| **Q11** | Backend language: confirm **Go** to match Substratal (vs. TypeScript Lambdas sharing types with the web app). | ✅ **Decided:** Go. |
| **Q12** | **Shared catalog** vs per-user catalog: are you comfortable with a global, moderated catalog (users' edits visible to everyone), or should early versions keep all catalog data private per user? | Global catalog seeded from MusicBrainz; user-created releases private until submitted. |
| **Q13** | Priority among the "other collections": memorabilia/tickets, show history (there's a sibling `shows` repo — related?), gear, print? | Order in [05](05-build-plan.md) Phase 3: memorabilia + show history first. |
| **Q14** | Native mobile in scope for this year, or PWA only? | PWA only until Phase 4. |
| **Q15** | Which **AWS account(s)/region** — the same account as Substratal prod or a separate one per env? | Separate accounts for dev/prod under the same org; region = Substratal's. |
