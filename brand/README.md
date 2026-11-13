# Brand

Collectors' Tune Tracker looks like a punk zine meets a record-store counter. The full guide is in the app at
**Help → Branding** (`/help/branding`). The spec is [`docs/spec/02-brand-and-design.md`](../docs/spec/02-brand-and-design.md).

| Where | What |
|---|---|
| [`/apps/web/public/brand`](../apps/web/public/brand) | **The brand kit.** Vector logos, logo icons, app icons, favicons, sample files, palettes and `ctt-brand-kit.zip`. Served at `/brand/…`. |
| [`/brand/scripts/build_brand.py`](scripts/build_brand.py) | Generates the kit and `packages/ui/src/palette.ts`. |
| [`/brand/logo`](logo) | The original raster logo art (PNG/JPG/GIF) the kit was derived from. |
| [`/packages/ui/src/themes.css`](../packages/ui/src/themes.css) | Source of truth for color: brand primitives and the ten themes. |

## The kit

- **Zine wordmark** (`logos/wordmark-*`): ransom-note letters, a vinyl O, a Dymo EST. 2024 strip, the XX face.
- **Logo icon** (`logos/icon-*`): a record sliding out of a hand-cut sleeve, XX eyes on the label, CTT in ransom tiles.
- **Lockup** (`logos/lockup-*`): the icon with the script name.
- **CTT stamp** and **XX face** (`logos/stamp-*`, `logos/xx-face-*`): single-color, five inks.
- **App icons and favicons** (`icons/`): full-bleed, maskable-safe squares, a simplified favicon glyph, an adaptive `favicon.svg`, and `favicon.ico`.
- **Samples** (`samples/`): social cards, email headers, avatars, a sticker sheet and a gig flyer.
- **Palettes** (`palette/`): JSON, CSS, ASE (Adobe) and GPL (GIMP/Inkscape).

Logos come in `dark` (for dark backgrounds) and `light` (for light backgrounds) versions, in `teal`, `signal` and
`mustard` colorways. Light versions use the deep accent variants so they keep their contrast on cream.

## Rebuilding

```sh
pip install fonttools          # once
brew install librsvg imagemagick  # once: rsvg-convert and magick
python3 brand/scripts/build_brand.py
```

All lettering is converted to outlines (fonts: Anton, Special Elite, Rubik Mono One, Playfair Display, Courier Prime,
Yellowtail and Space Grotesk, all OFL/Apache). Layouts are seeded, so the output is the same on every run. Change a seed
in the script to re-cut a mark. If you change `themes.css`, re-run the script: `palette.test.ts` fails until
`palette.ts` matches.
