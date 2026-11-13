/**
 * What's in the brand kit (apps/web/public/brand, built by brand/scripts/build_brand.py).
 * e2e/branding.spec.ts checks every file listed here is served.
 */

export const KIT = "/brand";
export const KIT_ZIP = `${KIT}/ctt-brand-kit.zip`;

export const LOOKS = ["dark", "light"] as const;
export const ACCENTS = ["teal", "signal", "mustard"] as const;
export type Look = (typeof LOOKS)[number];
export type Accent = (typeof ACCENTS)[number];

export interface LogoMark {
  id: string;
  name: string;
  job: string;
  /** File stem builder for a look + accent colorway. */
  file: (look: Look, accent: Accent) => string;
  preview: Record<Look, Accent>;
  png: string;
  min: string;
}

export const MARKS: LogoMark[] = [
  {
    id: "wordmark",
    name: "Zine wordmark",
    job: "The loud one. Ransom-note letters, a vinyl O, a Dymo EST. 2024 and the XX face. Heroes, the marketing site, splash screens, merch, social.",
    file: (look, accent) => `logos/wordmark-${look}-${accent}`,
    preview: { dark: "signal", light: "teal" },
    png: "1600px wide",
    min: "240px wide on screen · 50mm in print",
  },
  {
    id: "icon",
    name: "Logo icon (sleeve badge)",
    job: "The friendly one. A record sliding out of a hand-cut sleeve, XX eyes peeking off the label, CTT in ransom tiles. Nav logo, avatars, app icon art.",
    file: (look, accent) => `logos/icon-${look}-${accent}`,
    preview: { dark: "teal", light: "teal" },
    png: "1024 × 1024",
    min: "40px · below that use the favicon glyph",
  },
  {
    id: "lockup",
    name: "Horizontal lockup",
    job: "Badge plus the script name. Email headers, docs, invoices, anywhere a wide strip fits better than a square.",
    file: (look, accent) => `logos/lockup-${look}-${accent}`,
    preview: { dark: "mustard", light: "teal" },
    png: "1400px wide",
    min: "200px wide",
  },
];

export const STAMP_COLORS = ["cream", "charcoal", "teal", "signal", "mustard"] as const;

export interface IconFile {
  label: string;
  path: string;
  /** Size it's displayed at on the page, in CSS px. */
  shown: number;
}

const APP_ICON_SIZES: Array<[size: number, shown: number]> = [[1024, 112], [512, 88], [192, 64], [180, 52]];
const appIcons = (look: Look): IconFile[] =>
  APP_ICON_SIZES.map(([s, shown]) => ({ label: `${s} × ${s}`, path: `icons/app-icon-${look}-${s}.png`, shown }));

export const APP_ICONS: Record<Look, IconFile[]> = { dark: appIcons("dark"), light: appIcons("light") };

/** Favicons are shown at their real size. */
export const FAVICONS: IconFile[] = LOOKS.flatMap((look) =>
  [48, 32, 16].map((s) => ({ label: `${look === "dark" ? "Dark" : "Light"} ${s}px`, path: `icons/favicon-${look}-${s}.png`, shown: s })),
);

export const ICON_EXTRAS = [
  { label: "favicon.svg (switches with the browser's light/dark setting)", path: "icons/favicon.svg" },
  { label: "favicon.ico (16 · 32 · 48)", path: "icons/favicon.ico" },
  { label: "App icon source, dark (SVG)", path: "icons/app-icon-dark.svg" },
  { label: "App icon source, light (SVG)", path: "icons/app-icon-light.svg" },
];

export interface Sample {
  name: string;
  use: string;
  stem: string;
  size: string;
}

export const SAMPLES: Sample[] = [
  { name: "Social card · dark", use: "Open Graph / link previews", stem: "samples/social-card-dark", size: "1200 × 630" },
  { name: "Social card · light", use: "Open Graph / link previews", stem: "samples/social-card-light", size: "1200 × 630" },
  { name: "Email header · dark", use: "Newsletters, account email (shown at 600px)", stem: "samples/email-header-dark", size: "1200 × 300" },
  { name: "Email header · light", use: "Newsletters, account email (shown at 600px)", stem: "samples/email-header-light", size: "1200 × 300" },
  { name: "Avatar · dark", use: "Social profiles, app stores", stem: "samples/avatar-dark", size: "800 × 800" },
  { name: "Avatar · light", use: "Social profiles, app stores", stem: "samples/avatar-light", size: "800 × 800" },
  { name: "Sticker sheet", use: "Die-cut stickers for record fairs and swaps", stem: "samples/sticker-sheet", size: "1400 × 1000" },
  { name: "Gig flyer", use: "Letter-size flyer with tear-off tabs", stem: "samples/gig-flyer", size: "8.5 × 11 in @ 150dpi" },
];

export const PALETTE_FILES = [
  { label: "JSON", note: "Primitives and every theme's tokens", path: "palette/ctt-palette.json" },
  { label: "CSS", note: "Custom properties, drop-in", path: "palette/ctt-palette.css" },
  { label: "ASE", note: "Adobe Swatch Exchange (Illustrator, Photoshop, Affinity)", path: "palette/ctt-palette.ase" },
  { label: "GPL", note: "GIMP / Inkscape / Krita palette", path: "palette/ctt-palette.gpl" },
];

/** Every file the page links to, for the e2e check. */
export function allKitPaths(): string[] {
  const paths = new Set<string>(["ctt-brand-kit.zip"]);
  for (const m of MARKS) for (const l of LOOKS) for (const a of ACCENTS) for (const ext of ["svg", "png"]) paths.add(`${m.file(l, a)}.${ext}`);
  for (const c of STAMP_COLORS) for (const ext of ["svg", "png"]) paths.add(`logos/stamp-${c}.${ext}`), paths.add(`logos/xx-face-${c}.${ext}`);
  for (const l of LOOKS) for (const i of APP_ICONS[l]) paths.add(i.path);
  for (const i of [...FAVICONS, ...ICON_EXTRAS, ...PALETTE_FILES]) paths.add(i.path);
  for (const s of SAMPLES) paths.add(`${s.stem}.svg`), paths.add(`${s.stem}.png`);
  return [...paths];
}
