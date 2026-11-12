import { RansomTitle } from "@ctt/ui";
import { AppShell } from "../../_components/AppShell";
import { getThemePrefs } from "../../theme-server";
import { AppearanceForm } from "./AppearanceForm";

export const metadata = { title: "Appearance" };

export default async function AppearancePage() {
  const prefs = await getThemePrefs();
  return (
    <AppShell current="/settings/appearance">
      <section className="hero hero--compact">
        <div>
          <p className="eyebrow">Settings</p>
          <RansomTitle text="APPEARANCE" />
          <p className="muted lede">Pick a mode, then a light theme and a dark theme. System follows your device.</p>
        </div>
      </section>
      <AppearanceForm initial={prefs} />
    </AppShell>
  );
}
