/**
 * palette.ts is generated from themes.css (brand/scripts/build_brand.py) for Help → Branding.
 * This keeps the two in sync: change a theme color, re-run the script.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BRAND_PRIMITIVES, SWATCH_TOKENS, THEME_SWATCHES } from "./palette";
import { THEMES } from "./theme";

const css = readFileSync(fileURLToPath(new URL("./themes.css", import.meta.url)), "utf8");
const hexes = (block: string) =>
  Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1]!, m[2]!.toUpperCase()]));

describe("palette.ts matches themes.css (re-run brand/scripts/build_brand.py if this fails)", () => {
  it("brand primitives", () => {
    const root = hexes(css.split("[data-theme")[0]!);
    expect(BRAND_PRIMITIVES).toEqual(Object.fromEntries(Object.entries(root).filter(([k]) => k.startsWith("ctt-"))));
  });

  it.each(THEMES.map((t) => t.id))("theme %s", (id) => {
    const block = css.match(new RegExp(`\\[data-theme="${id}"\\]\\s*\\{([^}]*)\\}`))![1]!;
    const t = hexes(block);
    expect(THEME_SWATCHES[id]).toEqual(Object.fromEntries(SWATCH_TOKENS.map((k) => [k, t[k]])));
  });
});
