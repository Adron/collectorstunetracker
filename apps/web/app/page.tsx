import Link from "next/link";
import { HeroLogo, RansomTitle, XXFace } from "@ctt/ui";
import { AppShell } from "./_components/AppShell";

export default function ShelfPage() {
  return (
    <AppShell current="/">
      <section className="hero">
        <div>
          <p className="eyebrow">Main shelf · 0 items</p>
          <RansomTitle text="THE SHELF" />
          <p className="muted lede">Every pressing. Every scuff. Every story.</p>
        </div>
        <HeroLogo />
      </section>

      <div className="empty">
        <XXFace />
        <div>
          <strong>Nothing in the crate yet.</strong>
          <span className="muted">
            Add your first record: scan the barcode, search, or type it in. (Sign-in and collections arrive next; for now,
            pick your look in <Link href="/settings/appearance">Appearance</Link>.)
          </span>
        </div>
      </div>
    </AppShell>
  );
}
