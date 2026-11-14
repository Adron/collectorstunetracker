import { HeroLogo, RansomTitle, XXFace } from "@ctt/ui";
import { APP_URL, SiteFooter, SiteHeader } from "./_components/SiteChrome";

const FEATURES = [
  {
    title: "Catalog everything",
    body: "LPs, 7-inches, CDs, SACDs, cassettes, reels, MiniDiscs, digital buys, bootlegs, posters, ticket stubs, tour shirts, even the turntable.",
  },
  {
    title: "Down to the pressing",
    body: "Label, catalog number, matrix and runout etchings, vinyl color, weight, OBI strips. The details collectors actually care about.",
  },
  {
    title: "Shoot it. Grade it.",
    body: "Guided photos of covers, labels and runouts. Goldmine grades for media and sleeve, kept with your copy's history.",
  },
  {
    title: "Organize your way",
    body: "Collections, groups inside groups, and crates that cut across everything. Shelf B3, Blue Note 1500s, the sell pile.",
  },
  {
    title: "Public, private, or in between",
    body: "Share the whole collection, one group, or a single record. Or keep it all to yourself. What you paid stays private, always.",
  },
  {
    title: "Sell & trade",
    body: "List a record for sale or trade without opening up the rest of your shelf. Buyers message you directly.",
  },
  {
    title: "Bring it, take it",
    body: "Import from Discogs, CLZ, MusicBuddy or any spreadsheet. Export to Discogs CSV, JSON, or a full archive with your photos.",
  },
  {
    title: "Fall down the rabbit hole",
    body: "Follow producers, engineers, labels and lineups from one record to the next. Every record has a story.",
  },
];

const FORMATS = ["12\" LP", "10\"", "7\"", "Picture disc", "Test pressing", "78", "CD", "SACD", "MiniDisc", "Cassette", "8-track", "Reel-to-reel", "DAT", "Digital", "Poster", "Ticket stub", "Setlist", "Tour shirt", "Zine", "Gear"];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <section className="site-hero">
          <div className="site-hero-copy">
            <p className="eyebrow">The crate-digger's logbook · Est. 2024</p>
            <RansomTitle text="DIG DEEPER." />
            <p className="site-lede">
              Every pressing. Every scuff. Every story. Collectors' Tune Tracker is where you keep track of the music you own,
              and where your collection leads you next.
            </p>
            <div className="site-cta">
              <a className="btn btn-hot" href={APP_URL}>Start your shelf</a>
              <a className="btn btn-ghost" href={APP_URL}>Log in</a>
            </div>
          </div>
          <HeroLogo className="site-hero-logo" />
        </section>

        <section id="features" className="site-section" aria-labelledby="features-h">
          <h2 id="features-h" className="display site-h2">What it does</h2>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="card card--taped feature">
                <h3 className="display feature-h">{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="formats" className="site-section" aria-labelledby="formats-h">
          <h2 id="formats-h" className="display site-h2">If it holds music, it fits</h2>
          <ul className="format-list">
            {FORMATS.map((f) => (
              <li key={f} className="format-pill">{f}</li>
            ))}
          </ul>
        </section>

        <section id="privacy" className="site-section privacy panel" aria-labelledby="privacy-h">
          <XXFace className="privacy-face" />
          <div>
            <h2 id="privacy-h" className="display site-h2">Your shelf, your rules</h2>
            <p>
              Everything starts private. You decide what the world sees, from the whole collection down to a single record.
              Prices paid, receipts and where things live are never shown to anyone. Export everything, any time.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
