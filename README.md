![Collectors' Tune Tracker](brand/logo/github-banner/5.png)

# Collectors' Tune Tracker (CTT)

**The crate-digger's logbook.** Catalog every record, CD, tape, poster, and ticket stub you own — photograph it,
grade it, value it — then follow the people, labels, and pressings that connect one piece of music to the next.

> 🚧 **Re-platforming in progress (Nov 2026).** This repo is being rebuilt from the spec in [`docs/spec`](docs/spec).
> The old Create-React-App prototype in `src/` is slated for removal, and the former
> `collectorstunetracker_db` repo now lives in [`legacy/database`](legacy/database) for reference.

## Specification

| Doc | What's in it |
|---|---|
| [01 — Product Spec](docs/spec/01-product-spec.md) | Vision, formats, collections & groups, visibility, sell & trade, themes, images |
| [02 — Brand & Design](docs/spec/02-brand-and-design.md) | Marks, palette, the 10-theme system, type, components, voice |
| [03 — Domain & Data Model](docs/spec/03-domain-and-data-model.md) | Catalog vs. copy, groups, effective visibility, market, RLS |
| [04 — Architecture](docs/spec/04-architecture.md) | Vercel + Neon + Blob, Substratal identity, jobs, caching |
| [05 — Build Plan](docs/spec/05-build-plan.md) | Audit, consolidation steps, phases |
| [06 — Open Questions](docs/spec/06-open-questions.md) | Decisions made and still pending |
| [07 — Import & Export](docs/spec/07-import-export.md) | Discogs CSV, CTT JSON, schema.org JSON-LD, importers |
| [08 — Hosting, Costs & Scaling](docs/spec/08-hosting-costs-and-scaling.md) | Blob-only option, Vercel vs. AWS costs, domain, deploy steps |
| [09 — AWS Architecture](docs/spec/09-aws-architecture.md) | Scale-out reference design |

**Theme lab:** open [`design/themes/index.html`](design/themes/index.html) in a browser.

**Setup runbooks (done by hand):** [Set up CTT on Substratal](docs/setup-on-substratal.md) · [Move the domain to AWS](docs/setup-domain-on-aws.md)

## Stack (target)

Next.js + React 19 + TypeScript on **Vercel** · **Neon** PostgreSQL · **Vercel Blob** for images and files ·
identity, orgs & roles via the **Substratal Apps** platform · documented scale-out path to AWS.

## Brand

Logo system lives in [`brand/logo`](brand/logo) — zine wordmark, sleeve badge, and CTT block in
charcoal `#1C191A`, cream `#F6E7D8`, teal `#07A5C3`, signal `#F14902`, and mustard `#F4B324`.

## Links

* Product site: https://collectorstunetracker.com · App: https://app.collectorstunetracker.com (coming soon)
* Legacy [GitHub Pages site](https://adron.github.io/collectorstunetracker/) (`collectors_tracker_docs` branch, retiring)
* [Automated lookups / CDDB discussion — issue #4](https://github.com/Adron/collectorstunetracker/issues/4)

*Est. 2024.* · Proprietary. All rights reserved. See [LICENSE](LICENSE).
