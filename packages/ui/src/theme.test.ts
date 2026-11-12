import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_PREFS,
  parseThemeCookie,
  prefersDarkFromHint,
  resolveTheme,
  serializeThemeCookie,
  themeHtmlAttributes,
  type ThemePrefs,
} from "./theme";

const prefs = (p: Partial<ThemePrefs>): ThemePrefs => ({ ...DEFAULT_THEME_PREFS, ...p });

describe("resolveTheme", () => {
  it("light mode always uses the chosen light theme", () => {
    const p = prefs({ mode: "light", light: "gig-flyer", dark: "spray-can" });
    expect(resolveTheme(p, { prefersDark: true })).toBe("gig-flyer");
    expect(resolveTheme(p, { prefersDark: false })).toBe("gig-flyer");
    expect(resolveTheme(p, {})).toBe("gig-flyer");
  });

  it("dark mode always uses the chosen dark theme", () => {
    const p = prefs({ mode: "dark", light: "gig-flyer", dark: "spray-can" });
    expect(resolveTheme(p, { prefersDark: false })).toBe("spray-can");
    expect(resolveTheme(p, {})).toBe("spray-can");
  });

  it("system mode follows the device setting", () => {
    const p = prefs({ mode: "system", light: "newsprint", dark: "riso-night" });
    expect(resolveTheme(p, { prefersDark: true })).toBe("riso-night");
    expect(resolveTheme(p, { prefersDark: false })).toBe("newsprint");
  });

  it("system mode is undecided on the server when the device setting is unknown", () => {
    expect(resolveTheme(prefs({ mode: "system" }), {})).toBeUndefined();
  });

  it("prefers-contrast: more falls back to the high-contrast pair", () => {
    expect(resolveTheme(prefs({ mode: "dark", dark: "spray-can" }), { prefersMoreContrast: true })).toBe("xerox-black");
    expect(resolveTheme(prefs({ mode: "light", light: "gig-flyer" }), { prefersMoreContrast: true })).toBe("photocopy");
  });
});

describe("theme cookie", () => {
  it("round-trips", () => {
    const p = prefs({ mode: "dark", light: "riso-day", dark: "basement-show" });
    expect(parseThemeCookie(serializeThemeCookie(p))).toEqual(p);
  });

  it("falls back to defaults for missing or invalid values", () => {
    expect(parseThemeCookie(undefined)).toEqual(DEFAULT_THEME_PREFS);
    expect(parseThemeCookie("neon|back-room|cream-sleeve")).toEqual(DEFAULT_THEME_PREFS);
    expect(parseThemeCookie("dark|nope|xerox-black")).toEqual(prefs({ mode: "dark", dark: "xerox-black" }));
  });

  it("rejects a dark theme in the light slot and vice versa", () => {
    expect(parseThemeCookie("light|back-room|cream-sleeve")).toEqual(prefs({ mode: "light" }));
  });
});

describe("server rendering", () => {
  it("sets data-theme when the look is known", () => {
    expect(themeHtmlAttributes(prefs({ mode: "dark" }), {})["data-theme"]).toBe("back-room");
  });

  it("leaves data-theme to the boot script for unresolved system mode", () => {
    const attrs = themeHtmlAttributes(prefs({ mode: "system" }), {});
    expect(attrs["data-theme"]).toBeUndefined();
    expect(attrs["data-theme-light"]).toBe("cream-sleeve");
    expect(attrs["data-theme-dark"]).toBe("back-room");
  });

  it("uses the Sec-CH-Prefers-Color-Scheme client hint", () => {
    expect(prefersDarkFromHint('"dark"')).toBe(true);
    expect(prefersDarkFromHint("light")).toBe(false);
    expect(prefersDarkFromHint(null)).toBeUndefined();
    expect(themeHtmlAttributes(prefs({ mode: "system" }), { prefersDark: prefersDarkFromHint('"dark"') })["data-theme"]).toBe(
      "back-room",
    );
  });
});
