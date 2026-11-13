import { expect, test } from "@playwright/test";
import { allKitPaths, KIT } from "../app/help/branding/kit";

test.describe("Help → Branding", () => {
  test("is reachable from Help and headlined BRANDING", async ({ page }) => {
    await page.goto("/help");
    await page.getByRole("link", { name: /Branding/ }).click();
    await expect(page).toHaveURL(/\/help\/branding$/);
    await expect(page.getByRole("heading", { level: 1, name: "BRANDING" })).toBeVisible();
    for (const name of ["Logos", "Logo icons", "Color", "Sample files"]) {
      await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
    }
  });

  test("shows all ten themes with their colors", async ({ page }) => {
    await page.goto("/help/branding");
    await expect(page.locator(".brand-theme")).toHaveCount(10);
    await expect(page.locator('.brand-theme[data-theme="back-room"]')).toContainText("#07A5C3");
    await expect(page.locator('.brand-theme[data-theme="cream-sleeve"]')).toContainText("#05667A");
  });

  test("every kit file it links to is served", async ({ request }) => {
    for (const path of allKitPaths()) {
      const res = await request.head(`${KIT}/${path}`);
      expect(res.status(), path).toBe(200);
    }
  });
});
