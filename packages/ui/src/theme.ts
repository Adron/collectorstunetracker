/**
 * Theme selection for CTT: a mode (system / light / dark) plus one light and one dark theme.
 * Spec: docs/spec/02-brand-and-design.md §3.7 · Issue #7.
 */

export const DARK_THEMES = ["back-room", "spray-can", "basement-show", "riso-night", "xerox-black"] as const;
export const LIGHT_THEMES = ["cream-sleeve", "photocopy", "newsprint", "riso-day", "gig-flyer"] as const;
export const THEME_MODES = ["system", "light", "dark"] as const;

export type DarkThemeId = (typeof DARK_THEMES)[number];
export type LightThemeId = (typeof LIGHT_THEMES)[number];
export type ThemeId = DarkThemeId | LightThemeId;
export type ThemeMode = (typeof THEME_MODES)[number];

export interface ThemePrefs {
  mode: ThemeMode;
  light: LightThemeId;
  dark: DarkThemeId;
}

export const DEFAULT_THEME_PREFS: ThemePrefs = { mode: "system", light: "cream-sleeve", dark: "back-room" };

/** Used when the device asks for more contrast (`prefers-contrast: more`). */
export const HIGH_CONTRAST: { light: LightThemeId; dark: DarkThemeId } = { light: "photocopy", dark: "xerox-black" };

export const THEME_COOKIE = "ctt_theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months, the browser maximum

export interface ThemeMeta {
  id: ThemeId;
  code: string;
  name: string;
  look: "light" | "dark";
  blurb: string;
  /** Background color, used for <meta name="theme-color"> before CSS is computed. */
  bg: string;
}

export const THEMES: readonly ThemeMeta[] = [
  { id: "back-room", code: "D1", name: "Back Room", look: "dark", bg: "#1C191A", blurb: "The record shop after hours. Sleeve-badge teal on charcoal." },
  { id: "spray-can", code: "D2", name: "Spray Can", look: "dark", bg: "#000000", blurb: "Pure black wall, signal-orange XX face, drips and hard offset shadows." },
  { id: "basement-show", code: "D3", name: "Basement Show", look: "dark", bg: "#2F2C2D", blurb: "Smoke-grey low ceiling, mustard house lights, warm and loud." },
  { id: "riso-night", code: "D4", name: "Riso Night", look: "dark", bg: "#121011", blurb: "Two-ink riso on black stock: teal and fluoro orange, out of register." },
  { id: "xerox-black", code: "D5", name: "Xerox Black", look: "dark", bg: "#0B0A0A", blurb: "Monochrome photocopy. Toner and paper, one orange stamp for danger." },
  { id: "cream-sleeve", code: "L1", name: "Cream Sleeve", look: "light", bg: "#F6E7D8", blurb: "Cream stock, charcoal ink, deep-teal accents." },
  { id: "photocopy", code: "L2", name: "Photocopy", look: "light", bg: "#EEECE6", blurb: "Cold copy-shop paper, black toner, one red rubber stamp." },
  { id: "newsprint", code: "L3", name: "Newsprint", look: "light", bg: "#E5DDCF", blurb: "Warm grey pulp, serif headlines, mustard highlighter swipes." },
  { id: "riso-day", code: "L4", name: "Riso Day", look: "light", bg: "#F6E7D8", blurb: "Cream stock with teal and orange riso inks, slightly misregistered." },
  { id: "gig-flyer", code: "L5", name: "Gig Flyer", look: "light", bg: "#F4B324", blurb: "Mustard flyer on a telephone pole. Charcoal ink, cream paste-ups." },
];

export const themeMeta = (id: ThemeId): ThemeMeta => THEMES.find((t) => t.id === id)!;

export const isMode = (v: unknown): v is ThemeMode => THEME_MODES.includes(v as ThemeMode);
export const isLightTheme = (v: unknown): v is LightThemeId => LIGHT_THEMES.includes(v as LightThemeId);
export const isDarkTheme = (v: unknown): v is DarkThemeId => DARK_THEMES.includes(v as DarkThemeId);

/** Cookie value format: `mode|light|dark`, e.g. `system|cream-sleeve|back-room`. Invalid parts fall back to defaults. */
export function parseThemeCookie(value: string | undefined | null): ThemePrefs {
  if (!value) return { ...DEFAULT_THEME_PREFS };
  const [mode, light, dark] = decodeURIComponent(value).split("|");
  return {
    mode: isMode(mode) ? mode : DEFAULT_THEME_PREFS.mode,
    light: isLightTheme(light) ? light : DEFAULT_THEME_PREFS.light,
    dark: isDarkTheme(dark) ? dark : DEFAULT_THEME_PREFS.dark,
  };
}

export const serializeThemeCookie = (p: ThemePrefs): string => `${p.mode}|${p.light}|${p.dark}`;

export interface Environment {
  /** `prefers-color-scheme: dark`. Undefined when unknown (e.g. on the server without a client hint). */
  prefersDark?: boolean;
  /** `prefers-contrast: more`. */
  prefersMoreContrast?: boolean;
}

/** Which look (light or dark) is active. Returns undefined when it can't be known yet (system mode, unknown device). */
export function resolveLook(prefs: ThemePrefs, env: Environment): "light" | "dark" | undefined {
  if (prefs.mode !== "system") return prefs.mode;
  if (env.prefersDark === undefined) return undefined;
  return env.prefersDark ? "dark" : "light";
}

/** The theme to apply. Returns undefined only when system mode can't be resolved yet (the boot script decides). */
export function resolveTheme(prefs: ThemePrefs, env: Environment): ThemeId | undefined {
  const look = resolveLook(prefs, env);
  if (!look) return undefined;
  if (env.prefersMoreContrast) return HIGH_CONTRAST[look];
  return look === "dark" ? prefs.dark : prefs.light;
}

/** Attributes for <html>, rendered on the server. The boot script finishes the job for system mode. */
export function themeHtmlAttributes(prefs: ThemePrefs, env: Environment): Record<string, string> {
  const attrs: Record<string, string> = {
    "data-theme-mode": prefs.mode,
    "data-theme-light": prefs.light,
    "data-theme-dark": prefs.dark,
  };
  const theme = resolveTheme(prefs, env);
  if (theme) attrs["data-theme"] = theme;
  return attrs;
}

/** `Sec-CH-Prefers-Color-Scheme` client hint → prefersDark. */
export function prefersDarkFromHint(hint: string | null | undefined): boolean | undefined {
  if (!hint) return undefined;
  const v = hint.replaceAll('"', "").trim().toLowerCase();
  if (v === "dark") return true;
  if (v === "light") return false;
  return undefined;
}

/**
 * Inline <head> script. Runs before first paint: picks the theme for system mode, applies the high-contrast
 * fallback, keeps <meta name="theme-color"> in sync, and follows live changes to the device setting.
 * Kept dependency-free and tiny on purpose.
 */
export const THEME_BOOT_SCRIPT = `(()=>{try{
var d=document.documentElement,m=window.matchMedia,
 dark=m("(prefers-color-scheme: dark)"),hc=m("(prefers-contrast: more)"),
 bg=${JSON.stringify(Object.fromEntries(THEMES.map((t) => [t.id, t.bg])))},
 HC=${JSON.stringify(HIGH_CONTRAST)};
function apply(){var mode=d.dataset.themeMode||"system",
 look=mode==="system"?(dark.matches?"dark":"light"):mode,
 t=hc.matches?HC[look]:(look==="dark"?d.dataset.themeDark:d.dataset.themeLight);
 if(t){d.dataset.theme=t;var meta=document.querySelector('meta[name="theme-color"]');
 if(!meta){meta=document.createElement("meta");meta.name="theme-color";document.head.appendChild(meta);}
 meta.content=bg[t]||"#1C191A";}}
apply();window.__cttApplyTheme=apply;
dark.addEventListener("change",apply);hc.addEventListener("change",apply);
}catch(e){}})();`;
