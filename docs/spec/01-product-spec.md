# 01 — Product Specification: Collectors' Tune Tracker (CTT)

> Status: **Draft v0.1** · 2026-11-09 · Replaces the Create-React-App prototype on `main` and the `collectorstunetracker_db` repository in full.

## 1. Vision

**Collectors' Tune Tracker is the crate-digger's logbook.** It is where a music collector catalogs every
record, disc, tape, poster, and ticket stub they own, photographs them, grades them, values them, and
then *falls down the rabbit hole* — following the people, labels, pressings, and stories that connect one
piece of music to the next.

It keeps the four founding ideas from the original README and makes them concrete:

| Original idea (2024 README) | What it becomes in this spec |
|---|---|
| 1. Simple interface to look up music, musicians, artists, performers, writers | **Catalog & Explore** — fast search across your shelf *and* the shared music graph (§5.4) |
| 2. Manual updates and additions | **Collection management** — add, edit, photograph, grade any item (§5.1–5.3) |
| 3. Map correlations between music, people, history, events | **The Graph** — credits, relationships, events, and "liner notes" history (§5.5) |
| 4. Automated retrieval from other systems (CDDB, issue #4) | **Import & Identify** — barcode, disc TOC, matrix/runout, MusicBrainz, Discogs, gnudb (§5.6) |

### 1.1 The vibe in one paragraph
Punk-zine energy over a record-store counter. Charcoal backgrounds like the inside of a dim shop,
cream ransom-note lettering, a grinning-dead XX face sprayed in teal or orange, a script "Collectors'"
on a sleeve badge. It should feel like flipping through crates, not filling out a spreadsheet — while
still being precise enough for serious collectors who care about matrix numbers and Goldmine grades.
See [02 — Brand & Design System](02-brand-and-design.md).

## 2. Who it's for

| Persona | Needs |
|---|---|
| **The Crate Digger** (primary) | Hundreds to thousands of LPs/7"s. Wants to know exactly which pressing they own, its condition, and what it's worth. Hunts for specific variants. |
| **The Disc Hoarder** | CDs, box sets, Japanese imports with OBIs, SACDs. Cares about editions, masters, bonus tracks. |
| **The Tape Head** | Cassettes, reel-to-reel, MiniDisc, DAT, demos, bootlegs, mixtapes — much of which has no catalog entry anywhere. |
| **The Archivist / Memorabilia Keeper** | Posters, ticket stubs, setlists, signed items, zines, tour merch, show history. |
| **The Casual Listener** | Wants a good-looking shelf, a want list, and "what should I spin tonight?" |
| **Small shops & clubs** (later) | Shared collections — inventory for a shop, a radio station library, a listening club. The legacy schema's tenants/roles idea is kept, but delegated to Substratal **organizations** and **app roles**. |

## 3. Scope

### 3.1 In scope (v1)
- Accounts via the Substratal Apps platform (single sign-on across Substratal apps).
- Multiple named **collections** per user (e.g. "Main Shelf", "Jazz Room", "For Sale", "Dad's Records").
- All physical and digital music formats (§4), plus memorabilia and gear.
- **Images**: multiple photos per item, typed (front, back, labels, runout, OBI, damage…), with cover-art fallback.
- Pressing/edition-level detail, condition grading, provenance, valuation.
- Want list, crates (custom lists/tags), listening log.
- Search, filter, sort, and gallery ("shelf") view.
- Identify & import: barcode scan, CD disc-ID, MusicBrainz/Discogs search, CSV import (incl. Discogs export).
- Web app (responsive, installable PWA) with mobile-first capture flow.

### 3.2 Later (v2+)
- Native mobile apps (Substratal already has iOS/Android shells; CTT plugs in as a module).
- Public profile & shareable shelves; trade/sell listings.
- Market valuation feeds and price history.
- Shop/club tenants with roles (the legacy RBAC idea).
- Recommendation & "rabbit hole" discovery powered by the graph (+ optional Bedrock-powered liner-notes summaries).

### 3.3 Explicitly out of scope
- Streaming or hosting audio files. CTT tracks *what you own*; it can link out to listening services.
- Being a marketplace with payments in v1.

## 4. What can be collected

Every owned thing is a **Collection Item**. Each item has a **kind**, and music media kinds have a **format**
with format-specific attributes. Formats are data-driven (a `formats` reference table + JSON attribute
schema), so adding a new format never needs a schema migration.

### 4.1 Music media formats

| Family | Formats | Format-specific attributes |
|---|---|---|
| **Vinyl** | 12" LP, 10", 7" single, 12" single/maxi, EP, double/triple LP, box set, picture disc, shaped disc, flexi, lathe cut, test pressing, white label | RPM (33⅓/45/78), weight (g), color/variant (e.g. "translucent red w/ black splatter"), pressing plant, mastering/cutting engineer, **matrix/runout per side**, gatefold, insert/poster, hype sticker, numbered (n of N) |
| **Shellac** | 78 RPM 10"/12" | Material, label, matrix, take number |
| **CD & optical** | CD, CD single, enhanced CD, HDCD, SACD (hybrid/single layer), CD-R/promo, DVD-Audio, Blu-ray Audio, MiniDisc | **Disc ID / TOC** (for gnudb/MusicBrainz lookup), IFPI/mould SID codes, matrix ring, jewel/digipak/slipcase, OBI strip, region, number of discs |
| **Tape** | Cassette, 8-track, reel-to-reel, DAT, microcassette | Noise reduction (Dolby B/C/S, dbx), shell color, tape type (I/II/IV), speed (ips), track config, J-card style |
| **Digital** | Purchased downloads (FLAC/ALAC/MP3/WAV), Bandcamp purchases, hi-res | Source/store, bit depth/sample rate, codec, storage location (link only — no file hosting) |
| **Other / unofficial** | Bootleg, demo, mixtape, radio transcription, acetate, homemade | Free-form attributes; flagged *unofficial* |

### 4.2 Beyond media ("other music collections")
| Kind | Examples | Key attributes |
|---|---|---|
| **Memorabilia** | Posters, handbills, ticket stubs, backstage passes, setlists, signed items, tour programs, promo items | Event link, signed-by (people), authentication/COA, dimensions, framing |
| **Print** | Zines, music books, magazines, sheet music, songbooks | Issue/edition, ISBN/ISSN, publisher |
| **Apparel & merch** | Tour shirts, patches, pins | Tour/event link, size, year |
| **Gear** | Turntables, cartridges, tape decks, CD players, amps, instruments | Make/model, serial, service history — and "played on" links to items |
| **Show history** | Concerts attended (an *experience*, not an object) | Date, venue, lineup, setlist, linked stubs/photos/merch |

### 4.3 Item-level attributes (all kinds)
- Title (display), link to **Release** (if catalogued) or free-form details (if not)
- Collection(s), physical **location** (shelf / crate / box / slot), quantity (duplicates are separate copies)
- **Condition** — media and sleeve/packaging graded separately on the **Goldmine scale**
  (M, NM, VG+, VG, G+, G, F, P), plus free-text notes and damage photos
- **Provenance** — acquired date, source (shop, person, online, gift), price paid + currency, receipt photo
- **Value** — estimated value, value source, last valued date (manual in v1)
- **Status** — owned, want, ordered, lent out (to whom, since), for sale, sold, traded
- Tags, personal rating, personal notes, play count / last played (listening log)
- **Images** (§6)

## 5. Features

### 5.1 Collections & Shelf
- Create/rename/archive collections; each has a cover image and accent color from the brand palette.
- **Shelf view** — grid of covers, spine-out "crate flip" view for vinyl, and a dense list view for power users.
- Filter by format, genre, decade, label, condition, status, tag, location; sort by artist, added date, value, last played.
- Collection stats: counts by format/decade/genre, total estimated value, most-collected artists/labels.

### 5.2 Add an item (capture flow — mobile first)
1. **Scan or search**: barcode (camera), CD disc-ID (desktop helper, later), catalog number, or text search.
2. **Pick the exact pressing**: show candidate releases side by side with label/runout photos to compare.
3. **Shoot it**: guided photo capture (front → back → labels/disc → runout), skip any step.
4. **Grade & note**: quick Goldmine picker for media and sleeve, price paid, where it lives.
5. Save. Under 30 seconds for a record that's already in the catalog.

Unknown items (bootlegs, demos, homemade) skip step 2 and go to a free-form form; they can be linked to a
catalog release later.

### 5.3 Item detail ("the sleeve")
A detail page styled like the back of a record sleeve: image carousel, tracklist, credits, pressing details,
your copy's condition/provenance, and "rabbit hole" links (other pressings, same producer, same studio,
same label year).

### 5.4 Search & Explore
- One search box across *your* items and the shared catalog (artists, releases, labels, people, events).
- Typo-tolerant, prefix search; filters as chips.
- Explore pages for **Artist**, **Person** (musician/writer/producer/engineer), **Label**, **Release**, **Event**, **Venue**.

### 5.5 The Graph (correlations)
- Credits: person ↔ release/track with role (performer, instrument, writer, producer, engineer, artwork, photography…).
- Relationships: member-of, collaborated-with, influenced-by, sampled, cover-of, remix-of.
- Events & history: tours, recording sessions, releases, notable moments — with dates for timeline views.
- **Rabbit hole** UI: follow links N hops out, with a breadcrumb trail ("you went: Big Black → Steve Albini → Electrical Audio → …").
- User-contributed edits to shared catalog data go through a lightweight review (v2: trust levels).

### 5.6 Import & Identify
- **MusicBrainz** (primary open catalog, CC0 core data) + **Cover Art Archive** for art fallback.
- **Discogs** API search and CSV collection import (most collectors already have a Discogs export).
- **gnudb / CDDB** disc-ID lookup (issue #4).
- Generic **CSV/JSON import** with column mapping and a dry-run preview.
- **Export**: CSV, JSON, and a full archive (data + images) at any time. Your collection is yours.

### 5.7 Want list, crates, and listening log
- **Want list** with target pressing, max price, priority; "found it" converts a want into an owned item.
- **Crates**: user-made lists across collections ("Sunday morning", "Records to digitize", "Sell pile").
- **Listening log**: tap "spinning now" → play count, last played, optional gear used.

### 5.8 Two front doors
- **`collectorstunetracker.com`**, the product site: what CTT is and who it's for, with screenshots of the shelf,
  the capture flow and the rabbit hole, plus supported formats, FAQ, privacy, and support. It's loud zine design with a
  prominent **Log in** / **Start your shelf** button that goes to the app. Static and fast; no account needed.
- **`app.collectorstunetracker.com`**, the app itself. A visitor who isn't signed in is sent straight to Substratal's
  hosted sign-in, then lands back on their shelf.
- Public shelves (§5.9) live under the app domain (`app.collectorstunetracker.com/s/{slug}`), viewable without signing in.

### 5.9 Sharing (v1 minimal)
- Per-collection visibility: private (default), unlisted link, public.
- Public shelf page uses the zine aesthetic and is read-only.

## 6. Images (first-class)

Images are core to collecting — they are how pressings get identified and how condition gets proven.

### 6.1 Image types
`front_cover`, `back_cover`, `spine`, `gatefold_inside`, `label_side_a`, `label_side_b` (and C/D…),
`runout_side_a`/`b`…, `disc` (CD/SACD face), `obi`, `insert`, `hype_sticker`, `booklet_page`,
`j_card`, `shell`, `box`, `damage`, `receipt`, `signature`, `coa`, `other`.

### 6.2 Requirements
- Multiple images per item; drag to reorder; choose the primary (defaults to `front_cover`).
- Upload from phone camera or desktop; HEIC/JPEG/PNG/WebP accepted, up to 25 MB each.
- **Direct-to-storage uploads** (presigned) with resumable/multipart support for large files.
- Server-side processing: EXIF/GPS stripping (privacy), auto-orient, renditions
  (thumb 200px, card 600px, detail 1600px, original kept private), AVIF/WebP + JPEG fallback,
  dominant color extraction (used for UI accents), perceptual hash to flag duplicates.
- Optional assist (v1.5): OCR on runout/label photos to suggest matrix and catalog numbers.
- Fallback art from Cover Art Archive when the user has no photos; clearly marked as "catalog image".
- Originals are private to the owner; renditions follow the collection's visibility.
- Storage quotas per user/plan. CTT owns this (the Substratal platform's billing only covers its own
  plans; apps that charge their users run their own billing — see [06 — Open Questions](06-open-questions.md)).

## 7. Non-functional requirements
| Area | Target |
|---|---|
| Performance | Shelf of 5,000 items renders first screen < 1.5 s on 4G; search results < 300 ms p95 |
| Scale (v1) | 100k users, 50M items, 200M images without re-architecture |
| Availability | 99.9% for read paths |
| Accessibility | WCAG 2.2 AA — the zine look must never cost contrast or legibility (see brand doc) |
| Privacy | Collections private by default; no location data kept from photos; full export & delete |
| Offline | PWA caches your shelf for read; capture queue works offline and syncs later |
| Internationalization | Unicode everywhere (Japanese/Cyrillic titles are common); multi-currency values |

## 8. Success metrics
- Time to add a catalogued record ≤ 30 s (median).
- ≥ 60% of added items have at least one user photo.
- Weekly active collectors / monthly active collectors ≥ 40%.
- Import success rate (Discogs CSV) ≥ 95% rows matched or cleanly flagged.

## 9. Related documents
- [02 — Brand & Design System](02-brand-and-design.md)
- [03 — Domain & Data Model](03-domain-and-data-model.md)
- [04 — Architecture: AWS + Substratal Apps](04-architecture.md)
- [05 — Consolidation & Build Plan](05-build-plan.md)
- [06 — Open Questions](06-open-questions.md)
