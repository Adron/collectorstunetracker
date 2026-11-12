# 08 — Hosting, Costs & Scaling

> Status: **Draft v0.2** · 2026-11-12 · Prices are list prices checked on 2026-11-12 (sources at the end) and
> rounded. Treat every total as an **estimate**: usage shape matters more than the decimals.

## 1. Recommendation in one paragraph

**Launch on Vercel (team `ctt-a-team`, already on Pro) + Neon Free + Vercel Blob.** At beta scale it costs only a few
dollars a month on top of the Pro fee you already pay, and it's the fastest way to ship. Keep the code portable:
plain Postgres, a `MediaStore` interface, and a job table. **The first thing to move to AWS is image delivery** (S3 +
CloudFront flat-rate), because image traffic is where Vercel gets expensive. Move the database and compute only if
growth justifies it ([09](09-aws-architecture.md)).

## 2. Option B: "just blob storage" (no Postgres)

You asked what it would take to build CTT on blob storage alone. Here's the design and the verdict.

### 2.1 Design

```
private store
  users/{sub}/profile.json                   handle, settings, profile visibility
  users/{sub}/collections/{colId}.json       collection + nested groups + all items (one document per collection)
  users/{sub}/crates.json, wants.json, listings.json
  users/{sub}/images/…                       originals + renditions
public store (regenerated on every change)
  shelves/{handle}/index.json                public projection: only effective-public items, public fields only
  shelves/{handle}/c/{colId}.json
  market/index-{shard}.json                  active listings, rebuilt by a job
```

- **Reads:** the app loads one collection document (≈2 KB per item, so ~2 MB for a 1,000-item collection) and
  filters, sorts, and searches in the browser. Public pages read the pre-built public projections straight from the CDN.
- **Writes:** read-modify-write of the collection document, serialized per user (a lock row, or a short-lived
  lock blob) because concurrent writes would otherwise overwrite each other. Check whether the current Blob SDK offers
  conditional (ETag) writes; if not, the app must serialize writes itself.
- **Visibility:** when anything changes, a job rebuilds that user's public projection files.
- **Export:** almost free: the storage format *is* the CTT JSON export.

### 2.2 What it costs and what breaks

| | Blob-only | Postgres + Blob (recommended) |
|---|---|---|
| Monthly cost at beta | ≈ $1 (storage) | ≈ $1 (Neon Free is $0) |
| Single-user features (catalog, grade, photos, groups, visibility) | ✅ Works | ✅ |
| Big collections (10k+ items) | ⚠️ Multi-MB documents on every load; needs splitting and a client-side index | ✅ Indexed queries |
| Concurrent edits (phone + laptop) | ⚠️ Needs custom locking; risk of lost writes | ✅ Transactions |
| Market search across all sellers | ❌ Needs a separately rebuilt index (reinventing a database) | ✅ One query |
| Shared catalog, credits graph, "who else owns this pressing" | ❌ Not practical | ✅ |
| Import de-duplication across a collection | ⚠️ Load everything into memory | ✅ |
| Privacy guarantees | ⚠️ Depend on every projection rebuild being correct and on time | ✅ Enforced in queries and RLS |

**Verdict:** blob-only is fine for a single-user personal tool, but CTT's core features (market, catalog, layered
visibility, imports) all need cross-record queries. Since Neon Free also costs $0, there's no saving to chase.
**Use Postgres for data. Use Blob for what blobs are good at:** images, import and export files, backups, and (later)
pre-rendered public projections for heavy-traffic shelves.

## 3. Cost scenarios

**Assumptions:** an average stored image is about 1.2 MB (re-encoded original about 0.9 MB plus renditions about
0.3 MB); 1.5 photos per item; database size about 4 KB per item including indexes; 30% of image requests miss the cache.
The Vercel Pro platform fee ($20/month, which includes $20 of usage credit) is **already paid** by `ctt-a-team`,
so it's shown separately.

> ⚠️ **Flat-rate CDN caveat:** Vercel Pro includes 1 TB/month of flat-rate CDN, and higher tiers are cheap
> ($20/month for 50 TB). But Vercel's terms **exclude** workloads where "large-scale delivery of media … constitutes
> a majority of bandwidth". An image-heavy collection app may be ruled ineligible, so the totals below use
> **on-demand** image transfer as the safe case, with the flat-rate case in brackets.

### S1 — Private beta: 100 collectors · 20k items · 30k images (36 GB) · ~150 GB image transfer/month

| | Vercel + Neon + Blob | AWS (in the Substratal account) |
|---|---|---|
| Platform | Pro fee (already paid) | — |
| Database | Neon Free: **$0** | Aurora cluster already running for Substratal: **≈ $0 extra** |
| Images: storage | 36 GB × $0.023 = **$0.83** | S3: **$0.83** |
| Images: delivery | ≈ **$7.50** on demand [$0 within the included 1 TB] | CloudFront flat-rate Free (100 GB) or Pro **$15** |
| Compute / API | Inside the $20 credit: **$0** | Lambda + API Gateway free tier: **≈ $1** |
| DNS / domain | Domain ≈ $1–2/month amortized | Route 53 zone $0.50 + domain ≈ $1–2 |
| **Extra per month** | **≈ $2–10** | **≈ $3–18** |
| Engineering effort | Low: build and push | High: Terraform, IAM, cross-account database access, deploy pipeline |

**At beta, AWS saves nothing and costs weeks of infrastructure work.**

### S2 — Growth: 5,000 collectors · 1M items · 1.5M images (1.8 TB) · ~3 TB image transfer · ~8M CDN requests/month

| | Vercel + Neon + Blob | Hybrid: Vercel app + **S3/CloudFront images** | All AWS |
|---|---|---|---|
| Platform | $20 (already paid) | $20 (already paid) | — |
| Database | Neon Launch: 365 CU-h × $0.106 + 4 GB × $0.35 ≈ **$40** | Neon Launch ≈ **$40** | Aurora (shared cluster) +0.5 ACU avg ≈ **$45** |
| Image storage | Blob 1.8 TB ≈ **$41** | S3 ≈ **$41** (Intelligent-Tiering ≈ $30) | S3 ≈ **$30–41** |
| Image delivery | Blob transfer 3 TB × $0.05 + origin transfer on misses ≈ **$205** [flat-rate tier: $20] | CloudFront flat-rate Pro **$15** (50 TB, 10M requests) | CloudFront Pro **$15** |
| Compute / API | ≈ **$20–60** over the credit | ≈ **$20–60** | Lambda + API Gateway ≈ **$15–25** |
| **Total per month** (excl. the $20 Pro fee) | **≈ $330** [≈ $145 if flat-rate eligible] | **≈ $135** | **≈ $105–125** |

**The hybrid captures most of the savings** (≈ $200/month) by moving only image storage and delivery. Because
of the `MediaStore` interface, that's a few days of work, not a re-platform.

### S3 — Scale: 50,000 collectors · 15M images (18 TB) · ~30 TB image transfer · ~80M requests/month · 40 GB database

| | Vercel + Neon + Blob | Hybrid (Vercel app + S3/CloudFront + Neon) | All AWS |
|---|---|---|---|
| Database | Neon Launch ≈ $170 (Scale plan ≈ $340 for a longer recovery window) | ≈ $170–340 | Dedicated Aurora Serverless v2, ~2 ACU avg ≈ **$180** + storage and I/O ≈ **$250** |
| Image storage | ≈ $414 | ≈ $280–414 | ≈ $280–414 |
| Image delivery | ≈ $2,000+ on demand [≈ $100–300 on a flat-rate tier, if allowed] | CloudFront Business **$200** (125M requests, 50 TB) | **$200** |
| Compute / requests | ≈ $300–600 | ≈ $300–600 (Vercel) | API Gateway + Lambda ≈ **$200–250** |
| **Total per month** (excl. the $20 Pro fee) | **≈ $2,900–3,400** | **≈ $1,000–1,550** | **≈ $950–1,150** |

### 3.1 What moving to AWS saves

| Scale | Move | Saves per month (vs. all-Vercel on demand) | Effort |
|---|---|---|---|
| Beta (S1) | Nothing | ≈ $0 | — |
| Growth (S2) | **Images → S3 + CloudFront** | **≈ $200** | Days |
| Growth (S2) | Everything → AWS | ≈ $210–225 (only ≈ $20 more than the hybrid) | Weeks |
| Scale (S3) | Images → S3 + CloudFront | ≈ $1,900 | Days |
| Scale (S3) | Everything → AWS | ≈ $2,000–2,250 | Weeks, plus ongoing ops |

## 4. When to move what

| Trigger (sustained for a month) | Move | Target |
|---|---|---|
| Image transfer > ~1 TB/month, or Vercel flags flat-rate ineligibility | **Images** | S3 (private bucket, Intelligent-Tiering) + CloudFront flat-rate plan with signed URLs/cookies for private images. Swap in `S3MediaStore`; copy existing blobs with a job. |
| Neon storage > 0.7 GB or compute > 70 CU-h on Free | Database plan | Neon Launch (pay as you go). Same connection string, no code change. |
| Database cost > ~$300/month, or you want everything in one AWS account | Database | Aurora PostgreSQL (dedicated cluster, or the `ctt` database in the shared cluster per [09 §4](09-aws-architecture.md#4-database)). `pg_dump`/restore or logical replication; CTT's SQL is portable by design. |
| Vercel function and request costs > ~$500/month, or needs Vercel can't meet | Compute | Lambda + API Gateway per [09](09-aws-architecture.md). The biggest move; only do it if the bill or requirements demand it. |

## 5. Domain: `collectorstunetracker.com`

**Current state:** the domain shows in the Vercel `ctt-a-team` team as **"Purchase in Process"**, and the `.com` registry
has no record of it (RDAP 404, NXDOMAIN). **The purchase never completed.** The name appears to be unregistered and available.

1. In the Vercel dashboard (team `ctt-a-team` → Domains), open `collectorstunetracker.com`. Retry or cancel the stuck
   purchase; if it won't clear, contact Vercel support and reference the pending purchase. (The Pro "free first-year domain"
   offer doesn't include `.com`.)
2. Once registered, add it to projects:
   - `collectorstunetracker.com` → `ctt-site`, and `www.collectorstunetracker.com` → 308 redirect to the apex;
   - `app.collectorstunetracker.com` → `ctt-app`.
3. Vercel DNS handles the certificates automatically. Add mail records later only if the domain needs its own email (Q17).
4. Keep the domain at Vercel. [`setup-domain-on-aws.md`](../setup-domain-on-aws.md) applies only if CTT later moves fully to AWS.

## 6. Build & deploy on Vercel: what it takes

| Step | Work | Who | Rough effort |
|---|---|---|---|
| 1 | Fix the domain purchase (§5) | You | 15 min (plus the registrar's time) |
| 2 | Substratal onboarding per [`setup-on-substratal.md`](../setup-on-substratal.md) (already updated with the theme settings) | You | 1 hour (plus review time) |
| 3 | Monorepo scaffold (Turborepo, `apps/site`, `apps/web`, `packages/*`), CI (lint, typecheck, test, Playwright) | Claude | 1–2 days |
| 4 | Create Vercel projects `ctt-site` and `ctt-app` in `ctt-a-team`, linked to the GitHub repo; install the **Neon** integration (Free plan, `us-east-1`, preview branching on); create a **Blob** store; set environment variables | Claude with you (dashboard approvals) | ½ day |
| 5 | Theme system + app shell + marketing site ([#7](https://github.com/Adron/collectorstunetracker/issues/7)) | Claude | 2–3 days |
| 6 | Data model + migrations + RLS + visibility read model | Claude | 3–4 days |
| 7 | Auth against Substratal (real when the hosted page is live; mocked until then) | Claude | 2 days |
| 8 | Collections, groups, items, grading, images | Claude | 1–2 weeks |
| 9 | Visibility UI + public pages | Claude | 1 week |
| 10 | Import/export (Discogs CSV first) | Claude | 1 week |
| 11 | Listings + market + messages | Claude | 1–1½ weeks |
| 12 | Point the domains at the projects, production deploy, smoke tests | Claude with you | ½ day |

**Running cost to reach launch:** the existing Pro fee plus a few dollars a month (S1). There's no new subscription
unless Neon or Blob usage outgrows the free amounts.

## Sources

- Vercel Pro plan (platform fee, $20 credit, flat-rate CDN included): https://vercel.com/docs/plans/pro-plan
- Vercel Flat Rate CDN tiers and media-delivery exclusion: https://vercel.com/docs/pricing/flat-rate-cdn
- Vercel Blob pricing ($0.023/GB-month, operations, transfer example): https://vercel.com/docs/vercel-blob/usage-and-pricing
- Vercel Hobby (non-commercial only): https://vercel.com/docs/plans/hobby
- Neon pricing (Free: 1 GB / 100 CU-hours / 5 GB egress per project; Launch $0.106/CU-hour, $0.35/GB-month): https://neon.com/pricing
- Neon free-plan limits FAQ: https://neon.com/faqs/free-plan-limits-and-quotas
- CloudFront flat-rate plans (Free / Pro $15 / Business $200 / Premium $1,000): https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html
