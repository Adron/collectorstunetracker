import Link from "next/link";
import type { ReactNode } from "react";
import { Drips, SleeveLogo } from "@ctt/ui";

const NAV = [
  { href: "/", label: "Shelf" },
  { href: "/search", label: "Search" },
  { href: "/crates", label: "Crates" },
  { href: "/market", label: "Market" },
  { href: "/settings/appearance", label: "You" },
];

export function AppShell({ children, current }: { children: ReactNode; current?: string }) {
  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <Link href="/" className="brand-link" aria-label="Collectors' Tune Tracker, home">
          <SleeveLogo />
        </Link>
        <nav aria-label="Main" className="mainnav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="mainnav-link" aria-current={current === n.href ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/add" className="btn btn-accent add-btn">+ Add</Link>
      </header>
      <Drips />
      <main id="main" className="main">{children}</main>
    </div>
  );
}
