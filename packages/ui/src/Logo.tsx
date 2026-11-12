/** Logo variants come from the active theme's tokens (--logo-sleeve / --logo-hero), so they follow the theme. */
export function SleeveLogo({ className, label = "Collectors' Tune Tracker" }: { className?: string; label?: string }) {
  return <span className={["logo-sleeve", className].filter(Boolean).join(" ")} role="img" aria-label={label} />;
}

export function HeroLogo({ className }: { className?: string }) {
  return <span className={["logo-hero", className].filter(Boolean).join(" ")} aria-hidden="true" />;
}
