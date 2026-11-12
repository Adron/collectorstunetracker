import { RansomTitle, XXFace } from "@ctt/ui";
import { AppShell } from "./AppShell";

export function ComingSoon({ current, title, blurb }: { current: string; title: string; blurb: string }) {
  return (
    <AppShell current={current}>
      <section className="hero">
        <div>
          <p className="eyebrow">Coming soon</p>
          <RansomTitle text={title} />
          <p className="muted lede">{blurb}</p>
        </div>
      </section>
      <div className="empty">
        <XXFace />
        <div>
          <strong>Still pressing this one.</strong>
          <span className="muted">It lands in a later phase of the build.</span>
        </div>
      </div>
    </AppShell>
  );
}
