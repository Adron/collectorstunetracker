import type { CSSProperties, ElementType } from "react";

/** Fonts for the cut-out letters, as [css font-family, weight, size scale]. */
const FONTS: Array<[string, number, number]> = [
  ['var(--font-anton, "Anton")', 400, 1],
  ['var(--font-special-elite, "Special Elite")', 400, 0.92],
  ['var(--font-rubik-mono-one, "Rubik Mono One")', 400, 0.78],
  ['var(--font-playfair-display, "Playfair Display")', 900, 1.02],
  ['var(--font-courier-prime, "Courier Prime")', 700, 0.95],
];

/** Deterministic PRNG so a title always renders the same (and server and client agree). */
function seeded(text: string): () => number {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

interface Props {
  text: string;
  as?: ElementType;
  className?: string;
  /** Font size of the title, e.g. "2rem". */
  size?: string;
}

/**
 * The zine ransom-note title. Decorative tiles are aria-hidden; the element carries the real text.
 * Use only for heroes, collection headers, public shelf titles and empty states (≤ ~24 characters).
 */
export function RansomTitle({ text, as: Tag = "h1", className, size }: Props) {
  const rnd = seeded(text);
  const tile = (ch: string, key: string) => {
    const [family, weight, scale] = FONTS[Math.floor(rnd() * FONTS.length)]!;
    const alt = rnd() < 0.3;
    const style: CSSProperties = {
      fontFamily: family,
      fontWeight: weight,
      fontSize: `${((0.9 + rnd() * 0.3) * scale).toFixed(3)}em`,
      ["--r" as string]: `${(rnd() * 8 - 4).toFixed(1)}deg`,
      ["--y" as string]: `${(rnd() * 4 - 2).toFixed(1)}px`,
    };
    return (
      <span key={key} aria-hidden="true" className={alt ? "ransom-tile ransom-tile--alt" : "ransom-tile"} style={style}>
        {ch}
      </span>
    );
  };
  // Letters are grouped per word so titles only wrap between words.
  return (
    <Tag className={["ransom", className].filter(Boolean).join(" ")} aria-label={text} style={size ? { fontSize: size } : undefined}>
      {text.split(" ").map((word, w) => (
        <span key={w} className="ransom-word" aria-hidden="true">
          {[...word].map((ch, i) => tile(ch, `${w}-${i}`))}
        </span>
      ))}
    </Tag>
  );
}
