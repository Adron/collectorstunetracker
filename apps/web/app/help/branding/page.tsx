import Link from "next/link";
import { BRAND_PRIMITIVES, RansomTitle, THEMES, THEME_SWATCHES, XXFace, type SwatchToken } from "@ctt/ui";
import { AppShell } from "../../_components/AppShell";
import {
  ACCENTS, APP_ICONS, FAVICONS, ICON_EXTRAS, KIT, KIT_ZIP, LOOKS, MARKS, PALETTE_FILES, SAMPLES, STAMP_COLORS, type Look,
} from "./kit";

export const metadata = { title: "Branding · Help" };

const href = (path: string) => `${KIT}/${path}`;
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

const SECTIONS = [
  ["look", "The look"],
  ["logos", "Logos"],
  ["icons", "Logo icons"],
  ["color", "Color"],
  ["type", "Type"],
  ["usage", "Usage"],
  ["samples", "Sample files"],
] as const;

const PRIMITIVE_ROLES: Record<keyof typeof BRAND_PRIMITIVES, string> = {
  "ctt-charcoal": "Back Room background. The shop at night.",
  "ctt-ink": "Deepest surfaces, letterboxing.",
  "ctt-smoke": "Raised surfaces and cards on dark.",
  "ctt-cream": "Text on dark. Paper in light themes.",
  "ctt-teal": "Primary accent on dark: links, focus, actions.",
  "ctt-signal": "Hot accent on dark: highlights, wants, danger.",
  "ctt-mustard": "Warm accent on dark: ratings, value, new.",
  "ctt-teal-deep": "Teal for light paper (5.4:1 on cream).",
  "ctt-signal-deep": "Signal for light paper (5.1:1 on cream).",
  "ctt-mustard-deep": "Mustard for light paper (5.6:1 on cream).",
};

const SWATCH_LABELS: Partial<Record<SwatchToken, string>> = {
  bg: "Paper", surface: "Surface", sunken: "Sunken", text: "Ink", muted: "Muted", accent: "Accent",
  hot: "Hot", warm: "Warm", tile: "Ransom tile", tile2: "Alt tile", focus: "Focus",
};

/** Dark or light label on a swatch, whichever reads. */
function inkFor(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b! > 0.2 ? "#1C191A" : "#F6E7D8";
}

function Stage({ look, children, label }: { look: Look; children: React.ReactNode; label?: string }) {
  return (
    <figure className={`brand-stage brand-stage--${look}`}>
      {children}
      <figcaption>{label ?? (look === "dark" ? "On dark" : "On light")}</figcaption>
    </figure>
  );
}

function Downloads({ file }: { file: (look: Look, accent: (typeof ACCENTS)[number]) => string }) {
  return (
    <table className="brand-downloads">
      <caption className="visually-hidden">Downloads</caption>
      <thead>
        <tr>
          <th scope="col"><span className="visually-hidden">Version</span></th>
          {ACCENTS.map((a) => (
            <th scope="col" key={a}><i className={`brand-dot brand-dot--${a}`} aria-hidden="true" /> {cap(a)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {LOOKS.map((l) => (
          <tr key={l}>
            <th scope="row">For {l} backgrounds</th>
            {ACCENTS.map((a) => (
              <td key={a}>
                <a href={href(`${file(l, a)}.svg`)} download>SVG</a> · <a href={href(`${file(l, a)}.png`)} download>PNG</a>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function BrandingPage() {
  return (
    <AppShell current="/help">
      <nav aria-label="Breadcrumb" className="crumbs">
        <Link href="/help">Help</Link> <span aria-hidden="true">/</span> <span aria-current="page">Branding</span>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">Help · Brand kit</p>
          <RansomTitle text="BRANDING" />
          <p className="muted lede">
            Punk zine meets record-store counter. Every logo, icon, color and sample file for Collectors&apos; Tune Tracker,
            in dark and light. Grab what you need, or take the whole crate.
          </p>
          <p className="brand-cta">
            <a className="btn btn-accent" href={KIT_ZIP} download>Download the brand kit (.zip)</a>
          </p>
        </div>
        <XXFace className="brand-hero-face" title="XX face" />
      </section>

      <nav aria-label="On this page" className="brand-toc">
        {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <div className="brand-doc">
        {/* ------------------------------------------------------------ The look */}
        <section aria-labelledby="look" className="brand-section">
          <h2 id="look" className="display brand-h2">The look</h2>
          <p className="brand-copy">
            Hand-made, cut-and-paste, a little loud. Photocopied flyers, ransom-note letters, gaffer tape, spray paint and
            the grinning-dead XX face. Both modes are zine: dark is the record shop after hours, light is a fresh photocopy
            on cream stock.
          </p>
          <div className="brand-grid brand-grid--2">
            <div className="card card--taped brand-card">
              <p className="eyebrow">We are</p>
              <ul className="brand-list">
                <li>Hand-made, cut-and-paste, a little loud</li>
                <li>Obsessive about detail (matrix numbers matter)</li>
                <li>Dark-room cozy: charcoal and warm cream paper</li>
                <li>Funny and irreverent, never at the collector&apos;s expense</li>
              </ul>
            </div>
            <div className="card card--taped brand-card">
              <p className="eyebrow">We are not</p>
              <ul className="brand-list">
                <li>Corporate, sterile, spreadsheet-y</li>
                <li>Fussy or gatekeep-y</li>
                <li>Neon, glossy, &ldquo;streaming app&rdquo;</li>
                <li>Snarky at the user</li>
              </ul>
            </div>
          </div>
          <p className="brand-copy">
            <strong>Name:</strong> Collectors&apos; Tune Tracker, with the plural possessive apostrophe (it&apos;s a place{" "}
            <em>for collectors</em>). Short form <strong>CTT</strong>. Tagline: <em>Every pressing. Every scuff. Every story.</em>
          </p>
        </section>

        {/* ------------------------------------------------------------ Logos */}
        <section aria-labelledby="logos" className="brand-section">
          <h2 id="logos" className="display brand-h2">Logos</h2>
          <p className="brand-copy">
            All marks are vector, with every letter converted to outlines, so they look the same everywhere with no fonts
            installed. Each comes in a dark and a light version and three accent colorways. Use the dark version on charcoal
            or black, and the light version on cream or paper. On light paper the accents switch to their deep variants
            so they keep their contrast.
          </p>

          {MARKS.map((m) => (
            <article key={m.id} className="brand-mark" aria-labelledby={`mark-${m.id}`}>
              <header className="brand-mark-head">
                <h3 id={`mark-${m.id}`} className="brand-h3">{m.name}</h3>
                <p className="muted">{m.job}</p>
                <p className="brand-meta"><span>PNG {m.png}</span><span>Min. size {m.min}</span></p>
              </header>
              <div className="brand-grid brand-grid--2">
                {LOOKS.map((l) => (
                  <Stage key={l} look={l} label={`${l === "dark" ? "On dark" : "On light"} · ${cap(m.preview[l])}`}>
                    <img src={href(`${m.file(l, m.preview[l])}.svg`)} alt={`${m.name}, ${l} version, ${m.preview[l]} accent`} className={`brand-img brand-img--${m.id}`} />
                  </Stage>
                ))}
              </div>
              <Downloads file={m.file} />
            </article>
          ))}

          <article className="brand-mark" aria-labelledby="mark-stamp">
            <header className="brand-mark-head">
              <h3 id="mark-stamp" className="brand-h3">CTT stamp &amp; XX face</h3>
              <p className="muted">
                The utilitarian one and the troublemaker. The rubber-stamped CTT block goes on loading screens, docs, packing
                slips and the API. The XX face goes on avatars without a photo, error and 404 pages, &ldquo;lent out&rdquo; badges
                and stickers. Both are single-color: pick the ink that suits the paper.
              </p>
            </header>
            <div className="brand-grid brand-grid--5">
              {STAMP_COLORS.map((c) => (
                <Stage key={c} look={c === "cream" || c === "teal" || c === "mustard" ? "dark" : "light"} label={cap(c)}>
                  <img src={href(`logos/stamp-${c}.svg`)} alt={`CTT stamp in ${c}`} className="brand-img brand-img--stamp" />
                  <img src={href(`logos/xx-face-${c}.svg`)} alt={`XX face in ${c}`} className="brand-img brand-img--face" />
                  <span className="brand-swatch-links">
                    Stamp <a href={href(`logos/stamp-${c}.svg`)} download>SVG</a> · <a href={href(`logos/stamp-${c}.png`)} download>PNG</a>
                    <br />
                    Face <a href={href(`logos/xx-face-${c}.svg`)} download>SVG</a> · <a href={href(`logos/xx-face-${c}.png`)} download>PNG</a>
                  </span>
                </Stage>
              ))}
            </div>
          </article>
        </section>

        {/* ------------------------------------------------------------ Icons */}
        <section aria-labelledby="icons" className="brand-section">
          <h2 id="icons" className="display brand-h2">Logo icons</h2>
          <p className="brand-copy">
            App icons put the sleeve badge on a full-bleed square, with the art kept inside the center 80% so it survives
            round and squircle masks (they work as maskable PWA icons too). Below 48px the badge&apos;s lettering turns to
            mush, so favicons use a stripped-down glyph: the sleeve, the record and one accent rule.
          </p>
          <div className="brand-grid brand-grid--2">
            {LOOKS.map((l) => (
              <Stage key={l} look={l} label={`App icon · ${l}`}>
                <div className="brand-icon-row">
                  {APP_ICONS[l].map((i) => (
                    <a key={i.path} href={href(i.path)} download className="brand-icon-tile">
                      <img src={href(i.path)} alt="" width={i.shown} height={i.shown} />
                      <span>{i.label}</span>
                    </a>
                  ))}
                </div>
              </Stage>
            ))}
          </div>
          <div className="card brand-card">
            <p className="eyebrow">Favicons</p>
            <div className="brand-favicons">
              {FAVICONS.map((f) => (
                <a key={f.path} href={href(f.path)} download className={`brand-fav brand-fav--${f.path.includes("dark") ? "dark" : "light"}`}>
                  <img src={href(f.path)} alt="" width={f.shown} height={f.shown} />
                  <span>{f.label}</span>
                </a>
              ))}
            </div>
            <ul className="brand-list brand-files">
              {ICON_EXTRAS.map((f) => <li key={f.path}><a href={href(f.path)} download>{f.label}</a></li>)}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------------------ Color */}
        <section aria-labelledby="color" className="brand-section">
          <h2 id="color" className="display brand-h2">Color</h2>
          <p className="brand-copy">
            Every color comes from the original logo files. The brand defaults to dark. Teal, signal and mustard are made
            for charcoal; on cream paper always use their <em>deep</em> variants. Bright accents on cream fail contrast
            (teal 2.4:1, mustard 1.5:1), so never put them there.
          </p>

          <h3 className="brand-h3">Core palette</h3>
          <ul className="brand-swatches" aria-label="Core palette">
            {(Object.entries(BRAND_PRIMITIVES) as [keyof typeof BRAND_PRIMITIVES, string][]).map(([token, hex]) => (
              <li key={token} className="brand-swatch">
                <span className="brand-chip" style={{ background: hex, color: inkFor(hex) }}>{hex}</span>
                <strong>{token.replace("ctt-", "").replace("-", " ")}</strong>
                <code className="mono">--{token}</code>
                <span className="muted">{PRIMITIVE_ROLES[token]}</span>
              </li>
            ))}
          </ul>

          {(["dark", "light"] as const).map((look) => (
            <div key={look}>
              <h3 className="brand-h3">{look === "dark" ? "Dark themes" : "Light themes"}</h3>
              <div className="brand-themes">
                {THEMES.filter((t) => t.look === look).map((t) => {
                  const sw = THEME_SWATCHES[t.id];
                  return (
                    <article key={t.id} className="brand-theme" data-theme={t.id} aria-labelledby={`theme-${t.id}`}>
                      <header>
                        <span className="eyebrow">{t.code}</span>
                        <h4 id={`theme-${t.id}`} className="display">{t.name}</h4>
                        <p>{t.blurb}</p>
                      </header>
                      <ul className="brand-theme-swatches">
                        {(Object.keys(SWATCH_LABELS) as SwatchToken[]).map((k) => (
                          <li key={k}>
                            <i style={{ background: sw[k] }} aria-hidden="true" />
                            <span>{SWATCH_LABELS[k]}</span>
                            <code className="mono">{sw[k]}</code>
                          </li>
                        ))}
                      </ul>
                      <div className="brand-theme-sample" aria-hidden="true">
                        <span className="btn btn-accent">Add</span>
                        <span className="btn btn-hot">Want</span>
                        <span className="chip chip--mid">VG+</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="card brand-card">
            <p className="eyebrow">Palette files</p>
            <ul className="brand-list brand-files">
              {PALETTE_FILES.map((f) => (
                <li key={f.path}><a href={href(f.path)} download>{f.label}</a> <span className="muted">· {f.note}</span></li>
              ))}
            </ul>
            <p className="muted brand-small">
              The source of truth is <code className="mono">packages/ui/src/themes.css</code>. CI checks every theme for WCAG AA
              contrast. Pick your own themes in <Link href="/settings/appearance">Appearance</Link>.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ Type */}
        <section aria-labelledby="type" className="brand-section">
          <h2 id="type" className="display brand-h2">Type</h2>
          <p className="brand-copy">Three voices from the logos, plus a mono for the numbers collectors read character by character. All open-license Google Fonts.</p>
          <div className="brand-type">
            <div className="brand-type-row">
              <span className="eyebrow">Block · Anton</span>
              <p className="display brand-type-anton">2,417 records</p>
              <span className="muted">Page titles, big numbers. Uppercase. 2rem and up.</span>
            </div>
            <div className="brand-type-row">
              <span className="eyebrow">Script · Yellowtail</span>
              <p className="script brand-type-script">Collectors&apos;</p>
              <span className="muted">Sparingly: collection names, empty-state headlines. Never below 20px, never on controls.</span>
            </div>
            <div className="brand-type-row">
              <span className="eyebrow">Spaced caps · Space Grotesk 600</span>
              <p className="eyebrow brand-type-caps">Tune Tracker</p>
              <span className="muted">Eyebrows, labels, tab bars, metadata keys.</span>
            </div>
            <div className="brand-type-row">
              <span className="eyebrow">Body · Space Grotesk</span>
              <p className="brand-type-body">Talk like the person behind the counter who&apos;s genuinely excited about your find.</p>
              <span className="muted">All running text, forms, tables.</span>
            </div>
            <div className="brand-type-row">
              <span className="eyebrow">Mono · JetBrains Mono</span>
              <p className="mono brand-type-mono">FACT 10 A-1 · PORKY PRIME CUT</p>
              <span className="muted">Matrix and runout strings, catalog numbers, barcodes.</span>
            </div>
            <div className="brand-type-row">
              <span className="eyebrow">Ransom note · 5 cut-out faces</span>
              <RansomTitle as="p" text="DIG DEEPER" size="1.8rem" />
              <span className="muted">Heroes, collection covers, public shelves, empty states only. ~24 characters max.</span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ Usage */}
        <section aria-labelledby="usage" className="brand-section">
          <h2 id="usage" className="display brand-h2">Usage</h2>
          <div className="brand-grid brand-grid--2">
            <div className="card card--taped brand-card">
              <p className="eyebrow">Do</p>
              <ul className="brand-list brand-list--do">
                <li>Leave clear space around a mark at least the height of one ransom tile (the CTT tile on the icon).</li>
                <li>Use the dark version on charcoal or black and the light version on cream or paper.</li>
                <li>Pick one accent per surface, and match it to the collection&apos;s accent where there is one.</li>
                <li>Let album art be the star: keep the logo in the chrome, not on top of covers.</li>
                <li>Switch to the favicon glyph below 48px and to the icon below 240px of wordmark.</li>
              </ul>
            </div>
            <div className="card card--taped brand-card">
              <p className="eyebrow">Don&apos;t</p>
              <ul className="brand-list brand-list--dont">
                <li>Re-type the wordmark or rearrange its tiles. Use the files.</li>
                <li>Put bright teal, signal or mustard on cream. Use the deep variants.</li>
                <li>Stretch, outline, add gradients, glows or drop shadows to the marks.</li>
                <li>Recolor marks outside the palette, or use more than one accent in a mark.</li>
                <li>Use the ransom style for body text, buttons or anything longer than a headline.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ Samples */}
        <section aria-labelledby="samples" className="brand-section">
          <h2 id="samples" className="display brand-h2">Sample files</h2>
          <p className="brand-copy">The brand in use, ready to adapt. Every sample is an SVG you can edit, plus a PNG ready to post.</p>
          <div className="brand-samples">
            {SAMPLES.map((s) => (
              <figure key={s.stem} className="card brand-sample">
                <a href={href(`${s.stem}.png`)} className="brand-sample-img">
                  <img src={href(`${s.stem}.png`)} alt={`${s.name} sample`} loading="lazy" />
                </a>
                <figcaption>
                  <strong>{s.name}</strong>
                  <span className="muted">{s.use} · {s.size}</span>
                  <span><a href={href(`${s.stem}.svg`)} download>SVG</a> · <a href={href(`${s.stem}.png`)} download>PNG</a></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <div className="empty">
          <XXFace />
          <div>
            <strong>Need something that isn&apos;t here?</strong>
            <span className="muted">
              The kit is generated from <code className="mono">brand/scripts/build_brand.py</code>, so new sizes and colorways are a
              re-run away. Or <a href={KIT_ZIP} download>grab the whole kit</a>.
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
