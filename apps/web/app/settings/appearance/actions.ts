"use server";

import { cookies } from "next/headers";
import { isDarkTheme, isLightTheme, isMode, serializeThemeCookie, THEME_COOKIE, THEME_COOKIE_MAX_AGE, type ThemePrefs } from "@ctt/ui/theme";

export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Saves the theme preference. Phase 0: first-party cookie only.
 * When Substratal sign-in lands, this also PATCHes /users/{id}/apps/app_collectors-tune-tracker/settings (issue #7).
 */
export async function saveThemePrefs(prefs: ThemePrefs): Promise<SaveResult> {
  if (!isMode(prefs.mode) || !isLightTheme(prefs.light) || !isDarkTheme(prefs.dark)) {
    return { ok: false, error: "invalid_theme" };
  }
  (await cookies()).set(THEME_COOKIE, serializeThemeCookie(prefs), {
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true };
}
