# 06 — Open Questions & Decisions

## Decided

| # | Question | Decision (2026-11-09) |
|---|---|---|
| Q1 | Database engine & placement | Postgres (Aurora Serverless v2). CTT gets its **own `ctt` database** in the shared Substratal cluster, fully isolated and built to be moved out ([04 §4](04-architecture.md#4-database)). |
| Q2 | Real data in the legacy schema to migrate? | None assumed: design migration only. |
| Q3 | Fate of `Adron/collectorstunetracker_db` | **Delete.** History is preserved in `/legacy/database` on the pushed branch. Waiting only on a `gh` token with the `delete_repo` scope. |
| Q4 | Billing | Free in v1, with storage quotas; billing decided later. |
| Q5 | License | **Proprietary**, all rights reserved (`LICENSE`). |
| Q6 | Old branches | Delete `adding-project-skeleton-defaults` and `release` (pending, run by you). `collectors_tracker_docs` stays until the new marketing site ships, then gets deleted (its logos already live in `/brand/logo`). |
| Q7 | Theme | Punk-zine **everywhere**. Honor only the light/dark bit of Substratal's `sub_theme`; both modes are fully zine ([02 §3.6](02-brand-and-design.md#36-both-modes-are-zine)). |
| Q9 | Domain | `collectorstunetracker.com` = marketing/product site with **Log in**; `app.collectorstunetracker.com` = the app. Domain moves from Vercel to Route 53 ([setup-domain-on-aws.md](../setup-domain-on-aws.md)). |
| Q10 | Relationship to Substratal | Standalone **customer** app, self-registered by `admin-ctt@thrashingcode.com` under the **Collectors' Tune Tracker** org; public API only ([setup-on-substratal.md](../setup-on-substratal.md)). |
| Q11 | Backend language | Go. |
| Q13 | Sibling `shows` repo | Unrelated. Ignored. |

## Still open

| # | Question | Working assumption |
|---|---|---|
| **Q8** | Image worker: **Go + libvips** (consistent, harder packaging) or **Node + sharp** (easier HEIC/AVIF, second language)? | Go + libvips in a Lambda container image; switch if packaging costs more than 2 days. |
| **Q12** | Shared, moderated catalog vs per-user catalog? | Global catalog seeded from MusicBrainz; user-created releases private until submitted. |
| **Q14** | Native mobile this year, or PWA only? | PWA only until Phase 4. |
| **Q15** | AWS accounts. The Aurora cluster lives in Substratal's account. Should CTT run in that **same account**, or in its own accounts that assume a narrow cross-account role for the Data API? | Own CTT accounts (dev/prod) in the same AWS Organization, plus a cross-account role in the Substratal account that allows `rds-data` on the cluster and reads only `ctt/*` secrets. |
| **Q16** | **Hosted sign-in page.** `auth.substratalapps.com/authorize` isn't live, and self-registered apps can't use embedded login. When will the Substratal dashboard and hosted page ship? | CTT Phase 0 builds the full PKCE flow against the published contract. End-to-end login waits on the page. **No embedded-login workaround.** |
| **Q17** | Does `collectorstunetracker.com` need email of its own (e.g. a `support@` address for the marketing site)? The managing account now uses `admin-ctt@thrashingcode.com`, so Substratal signup no longer depends on it. | Not needed for launch; revisit when the support page ships. |
| **Q18** | Copyright holder name in `LICENSE`: you personally, or a company (e.g. Composite Code)? | "Adron Hall" for now. |
