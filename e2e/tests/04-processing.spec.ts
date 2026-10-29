import { expect, test } from "@playwright/test";
import {
  PROCESSING_RESOURCES,
  expectUploadSuccess,
  fixture,
  uploadFile,
} from "./helpers";

test.describe("processing pipeline", () => {
  test("processes uploaded data and shows the new results", async ({ page }) => {
    await page.goto("/input");

    await uploadFile(page, "Real Data", fixture("real.csv"));
    await expectUploadSuccess(page, "Real Data");

    await uploadFile(page, "Synthetic Data", fixture("synthetic.csv"));
    await expectUploadSuccess(page, "Synthetic Data");

    await page.getByRole("button", { name: "Trigger Result Processing" }).click();

    // Every resource reports its own status, so wait until all of them have
    // finished instead of only checking the first one.
    await expect(page.getByText(/computation successful!/)).toHaveCount(
      PROCESSING_RESOURCES,
      { timeout: 150_000 }
    );
    await expect(page.getByText(/Processing failed:/)).toHaveCount(0);

    await page.getByRole("link", { name: "Results", exact: true }).click();
    await expect(page).toHaveURL(/\/results$/);

    const metrics = page.locator(".ResultsMetric");
    await expect(metrics).toHaveCount(6);
    await expect(page.getByRole("status", { name: "Loading score" })).toHaveCount(0);
    await expect(metrics.getByText("N/A")).toHaveCount(0);
  });
});
