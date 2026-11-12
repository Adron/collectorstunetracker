"use client";

import { useEffect, useState, useTransition } from "react";
import { DARK_THEMES, LIGHT_THEMES, RansomTitle, themeMeta, type DarkThemeId, type LightThemeId, type ThemeId, type ThemeMode, type ThemePrefs } from "@ctt/ui";
import { saveThemePrefs } from "./actions";

declare global {
  interface Window {
    __cttApplyTheme?: () => void;
  }
}

const MODES: Array<{ value: ThemeMode; label: string; hint: string }> = [
  { value: "system", label: "System", hint: "Follows your device" },
  { value: "light", label: "Light", hint: "Always your light theme" },
  { value: "dark", label: "Dark", hint: "Always your dark theme" },
];

/** Apply to <html> immediately; the boot script resolves System mode and theme-color. */
function applyToDocument(p: ThemePrefs) {
  const d = document.documentElement.dataset;
  d.themeMode = p.mode;
  d.themeLight = p.light;
  d.themeDark = p.dark;
  window.__cttApplyTheme?.();
}

function useDeviceIsDark(): boolean | undefined {
  const [dark, setDark] = useState<boolean>();
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const on = () => setDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return dark;
}

export function AppearanceForm({ initial }: { initial: ThemePrefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [, startTransition] = useTransition();
  const deviceDark = useDeviceIsDark();

  const activeLook = prefs.mode === "system" ? (deviceDark === undefined ? undefined : deviceDark ? "dark" : "light") : prefs.mode;

  function update(next: ThemePrefs) {
    const previous = prefs;
    setPrefs(next);
    applyToDocument(next);
    setStatus("idle");
    startTransition(async () => {
      const res = await saveThemePrefs(next).catch(() => ({ ok: false as const, error: "network" }));
      if (res.ok) {
        setStatus("saved");
      } else {
        setPrefs(previous);
        applyToDocument(previous);
        setStatus("error");
      }
    });
  }

  return (
    <div className="appearance">
      <fieldset className="setting">
        <legend className="eyebrow">Mode</legend>
        <div className="seg" role="radiogroup" aria-label="Mode">
          {MODES.map((m) => (
            <label key={m.value} className="seg-option" data-selected={prefs.mode === m.value ? "" : undefined}>
              <input
                type="radio"
                name="mode"
                value={m.value}
                checked={prefs.mode === m.value}
                onChange={() => update({ ...prefs, mode: m.value })}
                className="visually-hidden"
              />
              {m.label}
            </label>
          ))}
        </div>
        <p className="muted setting-hint">
          {MODES.find((m) => m.value === prefs.mode)!.hint}
          {prefs.mode === "system" && deviceDark !== undefined ? ` (your device is ${deviceDark ? "dark" : "light"} right now)` : ""}.
        </p>
      </fieldset>

      <ThemePicker
        legend="Light theme"
        name="light"
        options={LIGHT_THEMES}
        value={prefs.light}
        inUse={activeLook === "light"}
        whenLabel={prefs.mode === "dark" ? "Used if you switch to Light or System" : "Used when the light look is on"}
        onChange={(light) => update({ ...prefs, light: light as LightThemeId })}
      />
      <ThemePicker
        legend="Dark theme"
        name="dark"
        options={DARK_THEMES}
        value={prefs.dark}
        inUse={activeLook === "dark"}
        whenLabel={prefs.mode === "light" ? "Used if you switch to Dark or System" : "Used when the dark look is on"}
        onChange={(dark) => update({ ...prefs, dark: dark as DarkThemeId })}
      />

      <div className="save-status" role="status" aria-live="polite">
        {status === "saved" ? <span className="toast">Filed. Your look is saved.</span> : null}
        {status === "error" ? <span className="toast">Something skipped. Try that again?</span> : null}
      </div>
    </div>
  );
}

function ThemePicker(props: {
  legend: string;
  name: string;
  options: readonly ThemeId[];
  value: ThemeId;
  inUse: boolean;
  whenLabel: string;
  onChange: (id: ThemeId) => void;
}) {
  return (
    <fieldset className="setting">
      <legend className="eyebrow">
        {props.legend} {props.inUse ? <span className="chip chip--top">In use now</span> : null}
      </legend>
      <p className="muted setting-hint">{props.whenLabel}.</p>
      <div className="theme-grid" role="radiogroup" aria-label={props.legend}>
        {props.options.map((id) => {
          const meta = themeMeta(id);
          const selected = props.value === id;
          return (
            <label key={id} className="theme-card" data-theme={id} data-selected={selected ? "" : undefined}>
              <input
                type="radio"
                name={props.name}
                value={id}
                checked={selected}
                onChange={() => props.onChange(id)}
                className="visually-hidden"
                aria-label={meta.name}
                aria-describedby={`theme-blurb-${id}`}
              />
              <span className="theme-card-top">
                <span className="logo-sleeve theme-card-logo" aria-hidden="true" />
                <span className="eyebrow">{meta.code}</span>
                {selected ? <span className="chip chip--top theme-card-check">Selected</span> : null}
              </span>
              <span aria-hidden="true">
                <RansomTitle as="span" text={meta.name.toUpperCase()} size="0.95rem" />
              </span>
              <span className="theme-card-blurb" id={`theme-blurb-${id}`}>{meta.blurb}</span>
              <span className="theme-card-swatches" aria-hidden="true">
                <i style={{ background: "var(--surface)" }} />
                <i style={{ background: "var(--accent)" }} />
                <i style={{ background: "var(--hot)" }} />
                <i style={{ background: "var(--warm)" }} />
              </span>
              <span className="theme-card-buttons" aria-hidden="true">
                <span className="btn btn-accent">Save</span>
                <span className="btn btn-ghost">Cancel</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
