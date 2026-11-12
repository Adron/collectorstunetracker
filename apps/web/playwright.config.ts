import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    // Locally, use the installed Chrome; CI installs Playwright's Chromium.
    ...(process.env.CI ? {} : { channel: "chrome" }),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npx next start --port ${PORT}`, port: PORT, reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
