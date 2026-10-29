import path from "node:path";
import { type Page, expect } from "@playwright/test";

/**
 * Base URL of the backend, used for request-based API contract checks.
 * Prefer the literal IPv4 address so Node does not resolve `localhost` to ::1,
 * which Docker's port forwarding does not always publish.
 */
export const E2E_API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

/** Absolute path of a file in the `fixtures` directory. */
export function fixture(name: string): string {
  return path.join(process.cwd(), "fixtures", name);
}

/** Number of resources the Input page triggers when processing starts. */
export const PROCESSING_RESOURCES = 11;

/** Navigate to a page through the header links instead of a deep link. */
export async function navigateTo(page: Page, name: "Input" | "Results"): Promise<void> {
  await page
    .getByRole("navigation")
    .getByRole("link", { name, exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/${name.toLowerCase()}$`));
}

/** Upload a file into the real or synthetic upload form. */
export async function uploadFile(
  page: Page,
  slot: "Real Data" | "Synthetic Data",
  file: string
): Promise<void> {
  const card = page.locator(".uploadSubCard", { has: page.getByRole("heading", { name: slot }) });
  await card.locator('input[type="file"]').setInputFiles(file);
  await card.getByRole("button", { name: "Upload", exact: true }).click();
}

/** Assert the upload form in `slot` reports success. */
export async function expectUploadSuccess(page: Page, slot: "Real Data" | "Synthetic Data") {
  const card = page.locator(".uploadSubCard", { has: page.getByRole("heading", { name: slot }) });
  await expect(card.getByText(/Upload successful/)).toBeVisible();
}
