# 06 — Open Questions & Decisions

## Decided

| # | Question | Decision |
|---|---|---|
| Q1 | Database | PostgreSQL. **Revised 2026-11-12:** a dedicated **Neon** project on the Vercel build (fully autonomous, free plan at launch). Aurora remains the AWS-path option ([09 §4](09-aws-architecture.md#4-database)). |
| Q2 | Legacy data to migrate? | None: design migration only. |
| Q3 | Fate of `Adron/collectorstunetracker_db` | **Delete.** History preserved in `/legacy/database`. Waiting on a `gh` token with `delete_repo`. |
| Q4 | Billing | Free in v1 with storage quotas; billing later. Listings carry no payments in v1. |
| Q5 | License | Proprietary, all rights reserved. |
| Q6 | Old branches | Delete `adding-project-skeleton-defaults` and `release` (you). `collectors_tracker_docs` goes when the new site ships. |
| Q7 | Look & feel | Punk-zine everywhere. **Updated 2026-11-12:** 5 dark + 5 light themes approved; users pick a mode (System/Light/Dark) plus one light and one dark theme ([02 §3.7](02-brand-and-design.md#37-the-theme-system)). |
| Q8 | Image processing | Node + **sharp** inside Vercel functions (the Go/libvips option only mattered for AWS Lambda). |
| Q9 | Domain | `collectorstunetracker.com` = marketing site; `app.collectorstunetracker.com` = the app. **Stays at Vercel**; the purchase must be completed first ([08 §5](08-hosting-costs-and-scaling.md#5-domain-collectorstunetrackercom)). |
| Q10 | Relationship to Substratal | Standalone customer app, `admin-ctt@thrashingcode.com`, Collectors' Tune Tracker org, public API only. |
| Q13 | Sibling `shows` repo | Unrelated. |
| Q15 | AWS accounts | Deferred: only matters if the AWS path is taken ([09](09-aws-architecture.md)). |
| Q19 | Hosting | **Vercel (team `ctt-a-team`, Pro) + Neon + Vercel Blob** for launch; AWS pieces only when the triggers in [08 §4](08-hosting-costs-and-scaling.md#4-when-to-move-what) are hit. |
| Q21 | Organization & privacy model | Collections → nested groups → items, plus crates; visibility at profile, collection, group, and item level, with inheritance ([01 §5.9](01-product-spec.md#59-visibility--privacy-profile--collection--group--item)). |

## Still open

| # | Question | Working assumption |
|---|---|---|
| **Q11** | Backend language. Go was chosen for AWS Lambda; on Vercel, **TypeScript** everywhere (Next.js route handlers) is simpler. OK to switch? | **TypeScript** ([04 §5](04-architecture.md#5-stack)). |
| **Q12** | Shared, moderated catalog vs per-user catalog? | Shared lazy catalog seeded from MusicBrainz; user-created releases private until submitted. |
| **Q14** | Native mobile this year, or PWA only? | PWA only. |
| **Q16** | Substratal's hosted sign-in page (`auth.substratalapps.com/authorize`) isn't live, and customer apps can't use embedded login. When will it ship? | Build with a mock; switch to real login when it's live. No workaround. |
| **Q17** | Does `collectorstunetracker.com` need its own email (e.g. `support@`)? | Not for launch. |
| **Q18** | Copyright holder in `LICENSE`: you or a company? | "Adron Hall". |
| **Q20** | Market rules: allow **trades** of unofficial items (bootlegs, homemade copies)? Allowed countries? Minimum seller account age? | No sale of unofficial items; trades of them off for now; any country; verified email required. |
| **Q22** | Should public profile pages be indexable by search engines by default? | Off by default; opt in per profile. |
| **Q23** | Message notifications: Substratal notifications (push/in-app) only, or also email? If email, through Substratal or a separate provider (e.g. Resend)? | Substratal notifications first; email decided before Phase 4. |
| **Q24** | Should the AWS scale-out start with the media move once image traffic passes ~1 TB/month? | Yes ([08 §4](08-hosting-costs-and-scaling.md#4-when-to-move-what)). |
