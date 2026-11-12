import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DEFAULT_THEME_PREFS, THEME_BOOT_SCRIPT, themeHtmlAttributes } from "@ctt/ui/theme";
import "@ctt/ui/themes.css";
import "@ctt/ui/components.css";
import "./site.css";
import { fontVariables } from "./fonts";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://collectorstunetracker.com"),
  title: "Collectors' Tune Tracker: the crate-digger's logbook",
  description:
    "Catalog every record, CD, tape, poster and ticket stub you own. Photograph it, grade it, organize it, share it on your terms, and trade it when you're ready.",
  openGraph: { title: "Collectors' Tune Tracker", description: "The crate-digger's logbook. Est. 2024.", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1C191A" };

// Signed-out pages: System mode with the default light/dark pair (docs/spec/02 §3.7).
const attrs = themeHtmlAttributes(DEFAULT_THEME_PREFS, {});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables} {...attrs} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
