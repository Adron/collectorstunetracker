import { expect, test, type Page } from "@playwright/test";

const theme = (page: Page) => page.locator("html").getAttribute("data-theme");
/** Click the visible card/option that wraps the radio with this accessible name. */
const pick = (page: Page, group: string, name: string) =>
  page.getByRole("radiogroup", { name: group }).locator("label", { has: page.getByRole("radio", { name, exact: true }) }).click();

test.describe("theme selection (#7)", () => {
  test("System mode follows the device: dark", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    expect(await theme(page)).toBe("back-room");
  });

  test("System mode follows the device: light", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    expect(await theme(page)).toBe("cream-sleeve");
  });

  test("System mode switches live when the device changes", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    expect(await theme(page)).toBe("cream-sleeve");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(() => theme(page)).toBe("back-room");
  });

  test("the theme is set before first paint (no flash)", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    // Capture data-theme at the very first DOMContentLoaded, before React hydrates.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { __firstTheme?: string }).__firstTheme = document.documentElement.dataset.theme;
      });
    });
    await page.goto("/");
    expect(await page.evaluate(() => (window as unknown as { __firstTheme?: string }).__firstTheme)).toBe("back-room");
  });

  test("picking themes and modes in Settings → Appearance applies instantly and persists", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/settings/appearance");

    // Choose a light theme while in System (device is light) → applies immediately.
    await pick(page, "Light theme", "Gig Flyer");
    await expect.poll(() => theme(page)).toBe("gig-flyer");

    // Choose a dark theme, then force Dark mode.
    await pick(page, "Dark theme", "Riso Night");
    await pick(page, "Mode", "Dark");
    await expect.poll(() => theme(page)).toBe("riso-night");
    await expect(page.getByRole("status")).toContainText("saved");

    // Persists across a reload and is rendered by the server (cookie), even though the device is light.
    await page.reload();
    expect(await theme(page)).toBe("riso-night");

    // Light mode → the chosen light theme, even on a dark device.
    await page.emulateMedia({ colorScheme: "dark" });
    await pick(page, "Mode", "Light");
    await expect.poll(() => theme(page)).toBe("gig-flyer");
  });

  test("theme-color follows the active theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", "#1C191A");
  });
});
