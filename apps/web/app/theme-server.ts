import "server-only";
import { cookies, headers } from "next/headers";
import { parseThemeCookie, prefersDarkFromHint, resolveTheme, THEME_COOKIE, themeHtmlAttributes, themeMeta, type ThemePrefs } from "@ctt/ui/theme";

export async function getThemePrefs(): Promise<ThemePrefs> {
  return parseThemeCookie((await cookies()).get(THEME_COOKIE)?.value);
}

/** <html> attributes + initial theme-color for the request. */
export async function getThemeRender() {
  const prefs = await getThemePrefs();
  const env = { prefersDark: prefersDarkFromHint((await headers()).get("sec-ch-prefers-color-scheme")) };
  const attrs = themeHtmlAttributes(prefs, env);
  const theme = resolveTheme(prefs, env);
  return { prefs, attrs, themeColor: theme ? themeMeta(theme).bg : "#1C191A" };
}
