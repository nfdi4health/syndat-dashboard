import { expect, test } from "@playwright/test";
import { expectUploadSuccess, fixture, uploadFile } from "./helpers";

test.describe("dataset storage", () => {
  test("stores the current results and shows them in the dataset selector", async ({
    page,
  }) => {
    // Stored datasets live in the backend until the container is removed, so
    // use a unique name to stay repeatable across retries and reruns.
    const name = `e2e-${Date.now()}`;

    await page.goto("/input");

    // Storing moves the real patient file into the new dataset, so upload one
    // first to keep the test repeatable against a reused backend.
    await uploadFile(page, "Real Data", fixture("real.csv"));
    await expectUploadSuccess(page, "Real Data");

    await page.getByRole("textbox", { name: "Dataset Name" }).fill(name);
    await page.getByRole("button", { name: "Store current Results" }).click();

    await expect(
      page.getByText(`Status 201: Successfully created dataset ${name}`)
    ).toBeVisible();

    await page.goto("/results");
    const selector = page.getByRole("combobox", { name: "Dataset" });
    await selector.click();
    await page.getByRole("option", { name }).click();

    await expect(selector).toHaveValue(name);
    // The "latest uploaded dataset" notice only applies to `default`.
    await expect(
      page.getByText(
        "Currently displaying the processed data results of the latest uploaded dataset."
      )
    ).toHaveCount(0);
    await expect(page.locator(".ResultsMetric")).toHaveCount(6);
  });
});
