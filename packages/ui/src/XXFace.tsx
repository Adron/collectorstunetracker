/** The grinning-dead XX face from the zine wordmark. Colors with `currentColor`. */
export function XXFace({ className, title }: { className?: string; title?: string }) {
  return (
    <svg className={["xx-face", className].filter(Boolean).join(" ")} viewBox="0 0 54 62" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <circle cx="27" cy="25" r="22" fill="none" stroke="currentColor" strokeWidth="5" />
      <path d="M14 15l9 9M23 15l-9 9M31 15l9 9M40 15l-9 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M16 37c4-6 18-6 22 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M12 42v10M40 44v14M25 47v6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
