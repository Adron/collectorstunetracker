/** Spray-paint drip edge. Colors with `currentColor` (defaults to the theme accent via CSS). */
export function Drips({ className }: { className?: string }) {
  return (
    <svg className={["drips", className].filter(Boolean).join(" ")} viewBox="0 0 600 22" preserveAspectRatio="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M0 0h600v4c-8 0-9 3-10 8s-2 9-5 9-4-5-4-9-2-6-8-6H460c-6 0-7 3-7 6s-1 6-3 6-3-3-3-6-1-6-6-6H300c-5 0-6 4-6 9s-2 10-5 10-4-5-4-10-1-9-7-9H160c-6 0-7 2-7 5s-1 5-3 5-3-2-3-5-1-5-6-5H60c-6 0-7 4-7 8s-1 7-3 7-3-3-3-7-1-8-7-8H0z"
      />
    </svg>
  );
}
