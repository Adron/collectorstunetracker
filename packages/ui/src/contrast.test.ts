/**
 * CI guard: every theme in themes.css must meet WCAG AA for the pairs the components use.
 * Same pairs as the live readout in design/themes/index.html.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { THEMES } from "./theme";

const css = readFileSync(fileURLToPath(new URL("./themes.css", import.meta.url)), "utf8");

function tokens(themeId: string): Record<string, string> {
  const block = css.match(new RegExp(`\\[data-theme="${themeId}"\\]\\s*\\{([^}]*)\\}`))?.[1];
  if (!block) throw new Error(`No token block for ${themeId}`);
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1]!, m[2]!]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const PAIRS: Array<[fg: string, bg: string, min: number]> = [
  ["text", "bg", 4.5],
  ["text", "surface", 4.5],
  ["muted", "bg", 4.5],
  ["muted", "surface", 4.5],
  ["muted", "sunken", 4.5],
  ["accent", "bg", 3],
  ["on-accent", "accent", 4.5],
  ["on-hot", "hot", 4.5],
  ["on-warm", "warm", 4.5],
  ["tile-fg", "tile", 4.5],
  ["tile2-fg", "tile2", 4.5],
];

describe.each(THEMES.map((t) => t.id))("theme %s", (id) => {
  const t = tokens(id);

  it.each(PAIRS)("%s on %s ≥ %s", (fg, bg, min) => {
    expect(t[fg], `--${fg} missing`).toBeDefined();
    expect(t[bg], `--${bg} missing`).toBeDefined();
    expect(contrast(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(min);
  });

  it("declares its color-scheme", () => {
    const block = css.match(new RegExp(`\\[data-theme="${id}"\\]\\s*\\{([^}]*)\\}`))![1]!;
    expect(block).toMatch(/color-scheme:\s*(light|dark);/);
  });

  it("matches the background used for <meta name=theme-color>", () => {
    expect(t.bg!.toUpperCase()).toBe(THEMES.find((m) => m.id === id)!.bg.toUpperCase());
  });
});
