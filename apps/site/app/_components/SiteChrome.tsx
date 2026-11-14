import { Drips, SleeveLogo } from "@ctt/ui";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.collectorstunetracker.com";
export const SUPPORT_EMAIL = "admin-ctt@thrashingcode.com";

export function SiteHeader() {
  return (
    <>
      <header className="site-top">
        <a href="/" className="site-brand" aria-label="Collectors' Tune Tracker">
          <SleeveLogo />
          <span className="eyebrow">Collectors' Tune Tracker</span>
        </a>
        <nav aria-label="Site" className="site-nav">
          <a href="/#features">What it does</a>
          <a href="/#formats">Formats</a>
          <a href="/#privacy">Privacy</a>
          <a href="/support">Support</a>
        </nav>
        <a className="btn btn-ghost" href={APP_URL}>Log in</a>
      </header>
      <Drips />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <span className="script">Collectors'</span>
      <span className="muted">© 2024–2026 Collectors' Tune Tracker. Est. 2024.</span>
      <a href="/support">Support</a>
      <a href={APP_URL}>Log in</a>
    </footer>
  );
}
