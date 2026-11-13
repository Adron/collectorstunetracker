import Link from "next/link";
import { RansomTitle, XXFace } from "@ctt/ui";
import { AppShell } from "../_components/AppShell";

export const metadata = { title: "Help" };

const SECTIONS = [
  {
    href: "/help/branding",
    eyebrow: "Brand kit",
    title: "Branding",
    blurb: "Logos, logo icons, colors for every dark and light theme, type, usage rules and sample files. Download the lot.",
  },
];

export default function HelpPage() {
  return (
    <AppShell current="/help">
      <section className="hero hero--compact">
        <div>
          <p className="eyebrow">Help</p>
          <RansomTitle text="HELP" />
          <p className="muted lede">How CTT works, and how it looks. More sections land as features ship.</p>
        </div>
      </section>
      <ul className="help-sections">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="card card--taped help-section">
              <span className="eyebrow">{s.eyebrow}</span>
              <span className="display help-section-title">{s.title}</span>
              <span className="muted">{s.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="empty">
        <XXFace />
        <div>
          <strong>More help is still pressing.</strong>
          <span className="muted">Guides for adding, grading and sharing arrive with those features.</span>
        </div>
      </div>
    </AppShell>
  );
}
