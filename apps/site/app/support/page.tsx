import type { Metadata } from "next";
import { APP_URL, SUPPORT_EMAIL, SiteFooter, SiteHeader } from "../_components/SiteChrome";

export const metadata: Metadata = {
  title: "Support · Collectors' Tune Tracker",
  description: "Get help with Collectors' Tune Tracker: your account, your collection, imports, exports and your data.",
};

const TOPICS = [
  {
    title: "Signing in",
    body: (
      <>
        You sign in to Collectors' Tune Tracker with your Substratal Apps account. Passwords, two-step
        verification and account recovery are handled there. If you can't get in, use "Forgot password" on the
        sign-in page first.
      </>
    ),
  },
  {
    title: "Your collection",
    body: <>Something wrong with a record, a photo, a grade or an import? Tell us which item and what you expected.</>,
  },
  {
    title: "Your data",
    body: (
      <>
        You can export everything from the app at any time. To have your Collectors' Tune Tracker data deleted,
        email us from the address on your account.
      </>
    ),
  },
];

export default function Support() {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Collectors' Tune Tracker support")}`;
  return (
    <>
      <SiteHeader />

      <main id="main">
        <section className="site-section" aria-labelledby="support-h">
          <p className="eyebrow">Help desk</p>
          <h1 id="support-h" className="display site-h2">Support</h1>
          <p className="site-lede">
            Stuck, found a bug, or have an idea? Email us at{" "}
            <a href={mailto}>{SUPPORT_EMAIL}</a>. A real person reads every message.
          </p>
          <p className="support-tip muted">
            It helps to include the email on your account, what you were doing, and a screenshot if you have one.
          </p>
          <div className="site-cta">
            <a className="btn btn-hot" href={mailto}>Email support</a>
            <a className="btn btn-ghost" href={APP_URL}>Open the app</a>
          </div>
        </section>

        <section className="site-section" aria-label="Common questions">
          <div className="feature-grid">
            {TOPICS.map((t) => (
              <article key={t.title} className="card card--taped feature">
                <h2 className="display feature-h">{t.title}</h2>
                <p>{t.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
