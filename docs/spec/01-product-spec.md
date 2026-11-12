# 01 — Product Specification: Collectors' Tune Tracker (CTT)

> Status: **Draft v0.2** · 2026-11-12 · Replaces the Create-React-App prototype on `main` and the `collectorstunetracker_db` repository in full.

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
- Add **anything music-related**: albums, singles, EPs, box sets, every physical and digital format, plus
  memorabilia, print, merch, gear, and show history (§4).
- Multiple named **collections** per user, each organized into nested **groups** (§5.1).
- **Visibility** at every level: whole profile, collection, group, and individual item (§5.9).
- **Sell & trade listings** (no in-app payments in v1) (§5.10).
- **Appearance:** 5 light + 5 dark zine themes, with System / Light / Dark mode (§5.11).
- All physical and digital music formats (§4), plus memorabilia and gear.
- **Images**: multiple photos per item, typed (front, back, labels, runout, OBI, damage…), with cover-art fallback.
- Pressing/edition-level detail, condition grading, provenance, valuation.
- Want list, crates (custom lists/tags), listening log.
- Search, filter, sort, and gallery ("shelf") view.
- Identify & import: barcode scan, CD disc-ID, MusicBrainz/Discogs search, imports from other collector tools, and exports in standard formats ([07 — Import & Export](07-import-export.md)).
- Web app (responsive, installable PWA) with mobile-first capture flow.

### 3.2 Later (v2+)
- Native mobile apps (Substratal already has iOS/Android shells; CTT plugs in as a module).
- In-app payments, offers/counter-offers, and buyer/seller feedback for listings.
- Market valuation feeds and price history.
- Shop/club tenants with roles (the legacy RBAC idea).
- Recommendation & "rabbit hole" discovery powered by the graph (+ optional Bedrock-powered liner-notes summaries).

### 3.3 Explicitly out of scope
- Streaming or hosting audio files. CTT tracks *what you own*; it can link out to listening services.
- Taking payments, holding funds, or shipping on users' behalf in v1. Listings connect buyers and sellers; the deal happens between them.

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

### 5.1 Collections, groups & shelf

The collection is organized as a tree the user controls:

```
Collector (profile, @handle)
└── Collection        "Main Shelf", "Jazz Room", "Dad's Records", "Tour Merch"
    └── Group         "Blue Note 1500s", "Shelf B", "Box 3", "7-inch singles"   (nested, any depth)
        └── Group     "Mono pressings"
            └── Item  one album, single, EP, box set, tape, poster, ticket, shirt, turntable…
```

- **Collections** are the top-level containers. Each has a cover image and an accent color from the active theme.
- **Groups** are nested folders inside a collection. Use them for series, shelves, boxes, genres, eras, or anything
  else. Every item lives in exactly one collection, and optionally in one group. Moving items between groups
  and collections is drag-and-drop on desktop and "Move to…" on mobile.
- **Crates** (§5.7) are the other way to organize: playlists that point at items anywhere, and an item can be in
  any number of crates.
- **Physical location** (room › shelf › slot) is a separate attribute, so "Blue Note 1500s" can be a group
  while the records sit on two different shelves.
- Create, rename, reorder, and archive collections and groups.
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
- Import from other collector tools (Discogs, CLZ Music, MusicBuddy, generic CSV, CTT's own JSON) and export at any
  time in standard and open formats. Full detail: [07 — Import & Export](07-import-export.md). Your collection is yours.

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
- Public and unlisted pages (§5.9) and listings (§5.10) live under the app domain (`app.collectorstunetracker.com/@handle/…`,
  `/market`), viewable without signing in.

### 5.9 Visibility & privacy (profile → collection → group → item)

Every level has a visibility setting, and the most specific explicit setting wins:

| Level | Settings | Default |
|---|---|---|
| **Profile** (`@handle`) | `private` or `public`. This is the **master switch**: a private profile makes everything private, whatever the lower levels say. | private |
| **Collection** | `private` · `unlisted` (anyone with the link) · `public` | private |
| **Group** | `inherit` · `private` · `unlisted` · `public` | inherit |
| **Item** | `inherit` · `private` · `unlisted` · `public` | inherit |

**Effective visibility** = profile is private → `private`. Otherwise, walk up item → group → parent groups →
collection and use the first explicit value. Examples:
- Make one whole collection public, but keep "Box 3 (bootlegs)" private: set the group to `private`.
- Keep everything private, but show off one signed test pressing: set that item to `public` (the profile must be public).
- Share a collection with one friend: `unlisted`, then send the link.

Rules that make it safe:
- **Some fields are never public**, whatever the visibility: price paid, where it was bought, receipts, physical
  location, private notes, loan borrowers, and the estimated value. There's a per-collection opt-in to show values.
  Users get separate *public notes* and *private notes*.
- **Images follow their item**, except `receipt`, `coa` and `damage` photos, which are private unless chosen individually.
- **Crates have their own visibility**, but a public crate only shows items whose effective visibility is public
  or unlisted. A crate can never expose a private item.
- The UI always shows the **effective** state with an icon and the reason, e.g. "Public, inherited from *Main Shelf*".
  Changing a parent shows how many items change: "Making this public will show 214 items."
- Bulk actions: select items or groups → set visibility.
- Unlisted links use unguessable slugs and can be regenerated (which revokes the old link).
- Public pages: profile (`/@handle`), collection, group, crate, and item pages, all in the zine look, server-rendered
  for fast loads and good link previews (Open Graph images use the cover art), and indexable by search engines
  only if the user opts in.

### 5.10 Sell & trade listings

Collectors can put items up for sale, trade, or either, without making the rest of their collection public.

- **Create a listing** from any item: type (`sale` / `trade` / `sale_or_trade`), asking price and currency,
  "accepts offers", what they'd trade for (free text, plus links to their want-list entries), shipping regions and
  notes, local pickup option, and which photos to show.
- **A listing is a public snapshot.** It shows the item's title, release, pressing details, media and sleeve grades, and
  the chosen photos, even if the item itself is private. Private fields (price paid, location, notes) are never included.
- **Status:** `draft` → `active` → `pending` → `sold` / `traded` / `withdrawn`, with an optional expiry date.
  Marking a listing sold or traded moves the item to a *Sold & traded* archive (private, kept for history).
- **Discover:** a Market page lists active listings, with filters for format, genre, decade, grade, price range,
  sale vs. trade, and ships-to country. Each seller's listings also appear on their profile, if it's public.
- **Contact:** "I'm interested" opens an in-app message thread between buyer and seller, with an email/push
  notification. There's no payment, escrow, or shipping in v1: the two people settle it themselves, and the
  listing page says so plainly.
- **Trust & safety:** report a listing; rate limits on new listings and messages; sellers must have a verified email;
  **items marked unofficial (bootlegs, homemade copies) can't be listed for sale** (trades of unofficial items are a
  later decision, Q20). Listings must follow the terms of service.
- **Later:** offers and counter-offers, Stripe Connect payments, buyer/seller feedback, Discogs listing sync.

### 5.11 Appearance: themes

- Ten themes from the brand system ([02 §3.7](02-brand-and-design.md#37-the-theme-system)): five dark (Back Room,
  Spray Can, Basement Show, Riso Night, Xerox Black) and five light (Cream Sleeve, Photocopy, Newsprint, Riso Day,
  Gig Flyer).
- In **Settings → Appearance** the user picks a **mode** (`System` · `Light` · `Dark`), a **light theme** (used whenever
  the light look is active), and a **dark theme** (used whenever the dark look is active).
- `System` follows the device's light/dark setting and switches live when it changes.
- The choice is saved to the user's account, so it follows them across devices, and also cached in a cookie so pages
  render in the right theme with no flash of the wrong colors.
- Defaults: mode `System`, light theme Cream Sleeve, dark theme Back Room. Signed-out pages (marketing site, public
  shelves) use the defaults and the visitor's device setting. A public shelf can optionally use its owner's chosen theme.

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
| Scale (v1) | 10k users, 2M items, 3M images on Vercel + Neon; the documented path to AWS covers 100k+ users ([08](08-hosting-costs-and-scaling.md)) |
| Availability | 99.9% for read paths |
| Accessibility | WCAG 2.2 AA — the zine look must never cost contrast or legibility (see brand doc) |
| Privacy | Private by default at every level; private fields never leave the owner; no location data kept from photos; full export & delete |
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
- [07 — Import & Export](07-import-export.md)
- [08 — Hosting, Costs & Scaling](08-hosting-costs-and-scaling.md)
