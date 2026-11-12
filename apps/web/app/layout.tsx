import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { THEME_BOOT_SCRIPT } from "@ctt/ui/theme";
import "@ctt/ui/themes.css";
import "@ctt/ui/components.css";
import "./app.css";
import { fontVariables } from "./fonts";
import { getThemeRender } from "./theme-server";

export const metadata: Metadata = {
  title: { default: "Collectors' Tune Tracker", template: "%s · CTT" },
  description: "The crate-digger's logbook. Catalog, photograph, grade, and share your records, CDs, tapes, and music memorabilia.",
  applicationName: "Collectors' Tune Tracker",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { attrs, themeColor } = await getThemeRender();
  return (
    <html lang="en" className={fontVariables} {...attrs} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={themeColor} />
        {/* Picks the theme before first paint (System mode, high contrast) and follows device changes. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
