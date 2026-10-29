import { defineConfig, devices } from "@playwright/test";

/**
 * System tests: run Playwright against a fully built docker-compose stack.
 *
 * The default base URL targets the frontend on port 3000, which is what both
 * docker compose and the Vite dev server expose.
 */
const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  // The tests share the mutable `default` dataset in the backend, so they must
  // not run against each other.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  // Result processing is a slow one-off computation (classifier, t-SNE,
  // privacy risks), so be generous with per-assertion and per-test timeouts.
  timeout: 180_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: E2E_BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  outputDir: "test-results",
});
