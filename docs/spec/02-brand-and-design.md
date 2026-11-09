# 02 — Brand & Design System

> Status: **Draft v0.1** · 2026-11-09 · Derived from the original logo work on the `collectors_tracker_docs`
> branch (now copied into [`/brand/logo`](../../brand/logo)). This document fills the gaps the logos
> leave open: type, color tokens, components, motion, voice, and accessibility.

## 1. Brand essence

**"Punk zine meets record-store counter."**

| We are | We are not |
|---|---|
| Hand-made, cut-and-paste, a little loud | Corporate, sterile, spreadsheet-y |
| Obsessive about detail (matrix numbers matter) | Fussy or gatekeep-y |
| Dark-room cozy — charcoal, warm cream paper | Neon, glossy, "streaming app" |
| Funny, irreverent (the XX face is grinning *and* dead) | Snarky at the user's expense |

**Name usage:** "Collectors' Tune Tracker" (note the plural possessive apostrophe — it's a place *for collectors*),
short form **CTT**. Tagline candidates: *"Est. 2024."* (already in the marks), *"Every pressing. Every scuff. Every story."*,
*"Dig deeper."*

## 2. The marks (existing assets)

All three families exist in `/brand/logo` in dark and light colorways. Each one has a job:

| Mark | Files | Job |
|---|---|---|
| **Zine wordmark** — ransom-note "TUNE TRACKER / COLLECTORS", "EST. 2024", XX face | `png/1–3`, `jpg/*`, `github-banner*/*`, `animated/*.gif` | Hero/marketing, splash screen, empty states, public shelf header, social. The loud one. |
| **Sleeve badge** — vinyl peeking out of a sleeve, script "Collectors'", spaced "TUNE TRACKER" | `png/8–14` | App icon, favicon, PWA icon, nav logo, email header. The friendly one. |
| **CTT block** — heavy condensed "CTT" with vertical "COLLECTORS' TUNE TRACKER" tab | `png/4–7` | Compact contexts: loading screens, OG images, stickers, docs, the API/dev surfaces. The utilitarian one. |
| **XX face** (extracted from the zine wordmark — *to do*) | — | Standalone glyph for avatars-without-photo, 404/error states, "lent out" badges, loading spinner (rotating like a record). |

**Gaps to produce (design tasks):**
1. Vector (SVG) masters of all three marks — currently only raster PNG/JPG/GIF.
2. Standalone XX-face SVG in each accent color.
3. Square app-icon set (iOS/Android/PWA maskable) from the sleeve badge — vinyl in accent, sleeve charcoal.
4. Favicon set (16/32/48 + SVG) — the vinyl-in-sleeve silhouette reads at 16px; the zine mark does not.
5. Ransom-letter sprite set (cream cutout tiles, A–Z, 0–9) so titles can be composed live (see §4.3).

## 3. Color

Sampled directly from the logo files. The brand runs **dark by default** — every master logo sits on charcoal.

### 3.1 Core palette

| Token | Hex | Sampled from | Role |
|---|---|---|---|
| `--ctt-charcoal` | `#1C191A` | Background of all dark marks | Primary background ("the shop at night") |
| `--ctt-ink` | `#000000` | GitHub banner bg | Deepest surfaces, image letterboxing |
| `--ctt-smoke` | `#2F2C2D` | `png/3` & `png/7` bg | Raised surfaces, cards |
| `--ctt-cream` | `#F6E7D8` | Ransom tiles, script "Collectors'" | Primary text on dark; paper background in light theme |
| `--ctt-teal` | `#07A5C3` | Vinyl in `png/9`, CTT block bg | **Primary accent** — links, focus, primary actions |
| `--ctt-signal` | `#F14902` | XX face in `png/1`, CTT block bg | **Hot accent** — highlights, "want", badges, destructive confirm |
| `--ctt-mustard` | `#F4B324` | Vinyl in `png/13`, `png/12` bg | **Warm accent** — ratings, value/price, "new" |

### 3.2 Accent assignment
Each user collection picks one of the three accents (teal / signal / mustard); the badge vinyl, header
stripe, and charts for that collection use it. That turns the three logo colorways into a feature.

### 3.3 Contrast rules (WCAG 2.2 AA, measured)

| Pair | Ratio | Allowed use |
|---|---|---|
| cream on charcoal | 14.41 | Everything |
| mustard on charcoal | 9.41 | Everything |
| teal on charcoal | 5.97 | Everything, including body links |
| signal on charcoal | 4.73 | Normal text OK (just), prefer ≥ 16px/bold |
| teal on smoke | 4.73 | OK |
| signal on smoke | 3.75 | **Large text / icons only** |
| charcoal on teal / signal / mustard | 5.97 / 4.73 / 9.41 | Buttons with dark labels ✔ |
| teal / signal / mustard on cream | 2.42 / 3.05 / 1.53 | ✘ **Never** — use the `-deep` variants below |

### 3.4 Light theme ("Cream Sleeve")
The light theme flips to the `png/14` colorway: cream paper with charcoal ink. Accents shift to deep variants:

| Token | Hex | On cream |
|---|---|---|
| `--ctt-teal-deep` | `#05667A` | 5.44 |
| `--ctt-signal-deep` | `#B23600` | 5.07 |
| `--ctt-mustard-deep` | `#7A5500` | 5.55 |
| `--ctt-muted-on-cream` | `#5A5456` | 6.11 |
| `--ctt-muted-on-charcoal` | `#A39A92` | 6.31 |

### 3.5 Semantic tokens (what components use)

```css
:root, [data-theme="dark"] {           /* "Back Room" — default */
  --bg: var(--ctt-charcoal);
  --surface: var(--ctt-smoke);
  --surface-sunken: var(--ctt-ink);
  --text: var(--ctt-cream);
  --text-muted: #A39A92;
  --accent: var(--ctt-teal);
  --accent-hot: var(--ctt-signal);
  --accent-warm: var(--ctt-mustard);
  --on-accent: var(--ctt-charcoal);
  --border: rgb(246 231 216 / 0.14);
  --focus-ring: var(--ctt-teal);
}
[data-theme="light"] {                  /* "Cream Sleeve" */
  --bg: var(--ctt-cream);
  --surface: #FBF3EA;
  --surface-sunken: #EBDCCB;
  --text: var(--ctt-charcoal);
  --text-muted: #5A5456;
  --accent: #05667A;
  --accent-hot: #B23600;
  --accent-warm: #7A5500;
  --on-accent: var(--ctt-cream);
  --border: rgb(28 25 26 / 0.16);
  --focus-ring: #05667A;
}
```

Condition grades get fixed semantic colors (used as small chips, always with the text label):
`M/NM` teal · `VG+/VG` mustard · `G+/G` signal · `F/P` muted.

> **Substratal theme cookie:** the Substratal Hub shares light/dark preference via the `sub_theme` cookie.
> CTT honors only its **light/dark** bit and maps it to Back Room / Cream Sleeve — CTT keeps its own
> palette rather than adopting Hub themes (see open question Q7).

## 4. Typography

The logos use three voices. We match them with open-license Google Fonts:

| Voice | In the logo | Web font | Use |
|---|---|---|---|
| **Block** | "CTT" heavy condensed | **Anton** | Page titles, big numbers (collection counts, value), section headers — UPPERCASE |
| **Script** | "Collectors'" | **Yellowtail** | Sparingly: collection names on covers, empty-state headlines, signatures. Never below 20px. Never for UI controls. |
| **Spaced caps** | "T U N E  T R A C K E R" | **Space Grotesk** 500, `letter-spacing: 0.3em`, uppercase | Eyebrows, labels, tab bars, metadata keys |
| **Body / UI** | — | **Space Grotesk** 400/500 | All running text, forms, tables |
| **Mono** | — | **JetBrains Mono** | Matrix/runout strings, catalog numbers, barcodes, disc IDs — collectors read these character-by-character |

Scale (rem, 16px base): 0.75 · 0.875 · 1 · 1.125 · 1.5 · 2 · 3 · 4.5 (Anton only at 2+).

### 4.3 Ransom-note titles (`<RansomTitle>`)
The zine wordmark's cut-out letters are the brand's signature. Use them live — carefully:
- A component renders each character as a cream "paper tile" on charcoal, cycling through 4–5 typefaces
  (Anton, Special Elite, Rubik Mono One, Playfair Display Black, Courier Prime), with a deterministic
  pseudo-random rotation (±4°), offset (±2px), and tile size jitter seeded by the string — so the same
  title always looks the same.
- **Only** for: landing hero, collection cover headers, public shelf titles, empty/404 states. Max ~24 characters.
- Accessibility: the visual tiles are `aria-hidden`; the element carries the real text via `aria-label`/visually-hidden text.
- `prefers-reduced-motion`: no wobble-in animation.

## 5. Texture, imagery & motion

- **Grain:** a subtle paper/photocopy noise overlay (SVG turbulence, ~4% opacity) on hero areas and empty states — never behind dense data.
- **Spray drips:** the XX face's drip marks become a decorative edge on hero sections and the 404 page.
- **Tape & staples:** photo cards in the item detail view can show a "taped" corner, like a zine collage.
- **Album art is the star.** Chrome stays charcoal so covers pop; the item page may tint its header using the
  cover's extracted dominant color (clamped to keep text contrast ≥ 4.5).
- **Motion:**
  - Loading = a vinyl (from the sleeve badge) slides out and spins at 33⅓ RPM (1.8 s/rev). 45 RPM for "fast" actions, as an easter egg.
  - Crate-flip: horizontal swipe through covers with a slight 3D tilt.
  - Adding an item: the record slides *into* the sleeve badge.
  - All motion respects `prefers-reduced-motion` (falls back to fades).

## 6. Components (gap fill)

| Component | Notes |
|---|---|
| **App shell** | Charcoal bg; left rail (desktop) / bottom tab bar (mobile): Shelf · Search · **Add (+)** · Crates · You. Sleeve badge in the rail. |
| **Cover card** | Square art, 4px radius (records aren't round-cornered), format pill (`LP`, `7"`, `CD`, `CS`, `MD`…), condition chip, accent stripe for the collection. |
| **Spine row** | Narrow vertical strips with rotated title text — the "crate" view for vinyl. |
| **Sleeve detail** | Item page laid out like a back cover: tracklist left, credits right, mono block for matrix/runout. |
| **Format pill** | Spaced-caps label in a rounded rectangle, outline style; icons per family (vinyl, disc, tape, reel, ticket, shirt, gear). |
| **Grade picker** | Segmented control M · NM · VG+ · VG · G+ · G · F · P, separate rows for Media and Sleeve. |
| **Photo capture** | Full-screen camera with a step strip (Front · Back · Labels · Runout · Extras) and a ghost overlay frame (square for 12"/7"/CD, tall for cassette J-card). |
| **Buttons** | Primary = teal fill, charcoal label, Anton uppercase not allowed in buttons (use Space Grotesk 600). Hot = signal fill. Ghost = cream outline. |
| **Empty states** | Ransom-note headline + XX face + one clear action. E.g. "NOTHING IN THE CRATE YET." → *Add your first record*. |
| **Toasts** | Like a sticker slapped on: slight rotation, cream tile, charcoal text. |

Accessible primitives: **react-aria-components** (same as the Substratal Hub) styled with the tokens above.

## 7. Voice & copy

- Talk like the person behind the counter who's genuinely excited about your find.
- Short. Lowercase-friendly in body copy; UPPERCASE reserved for Anton headings and spaced-caps labels.
- Use collector vocabulary correctly: *pressing, variant, matrix, runout, OBI, J-card, gatefold, first press, repress, test press*.
- Examples:
  - Save success: "Filed. It's on the shelf."
  - Lent out: "On loan to **Sam** since March. Hope they're careful."
  - Error: "Something skipped. Try that again?"
  - 404: "THIS ONE'S NOT IN THE CRATE."
  - Delete confirm: "Pull this from your collection? Photos go too."

## 8. Accessibility checklist
- All text/surface pairs from §3.3 only; automated contrast tests in CI against the token file.
- Focus ring: 2px `--focus-ring` + 2px offset, always visible on keyboard focus.
- Images: alt text auto-generated from type + release (e.g. "Front cover — *Unknown Pleasures*, Factory FACT 10, 1979 UK"), user-editable.
- Script and ransom type are decorative-only; every one has a plain-text equivalent.
- Hit targets ≥ 44px; the capture flow is fully operable one-handed.
