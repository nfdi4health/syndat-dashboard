import { expect, test } from "@playwright/test";

test.describe("results page", () => {
  test("renders the six quality and privacy scores of the default dataset", async ({
    page,
  }) => {
    await page.goto("/results");

    await expect(
      page.getByRole("heading", { name: "Quality Evaluation" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Privacy Evaluation" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Inspect Outliers" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Inspect Plots" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Correlation Plot" })
    ).toBeVisible();

    await expect(
      page.getByText(
        "Currently displaying the processed data results of the latest uploaded dataset."
      )
    ).toBeVisible();

    const metrics = page.locator(".ResultsMetric");
    await expect(metrics).toHaveCount(6);
    for (const label of [
      "Discrimination Complexity",
      "Distribution Similarity",
      "Correlation Score",
      "Singling Out Risk",
      "Linkability Risk",
      // The dashboard renders this label with a historical typo.
      "Inferrence Risk",
    ]) {
      await expect(page.getByRole("heading", { name: label })).toBeVisible();
    }

    // The shipped results must render as numbers, not as loading spinners.
    await expect(page.getByRole("status", { name: "Loading score" })).toHaveCount(0);
    await expect(metrics.getByText("N/A")).toHaveCount(0);
  });

  test("links to the datasets summary page", async ({ page }) => {
    await page.goto("/results");

    await page.getByRole("link", { name: "Datasets Summary" }).click();

    await expect(page).toHaveURL(/\/results\/summary$/);
    await expect(
      page.getByRole("heading", { name: "Dataset Summary" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Quality Summary" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Privacy Summary" })
    ).toBeVisible();
  });
});
