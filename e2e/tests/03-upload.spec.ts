import { expect, test } from "@playwright/test";
import { expectUploadSuccess, fixture, uploadFile } from "./helpers";

test.describe("upload validation", () => {
  test("rejects files that are not CSV", async ({ page }) => {
    await page.goto("/input");

    const realCard = page.locator(".uploadSubCard", {
      has: page.getByRole("heading", { name: "Real Data" }),
    });
    await uploadFile(page, "Real Data", fixture("notes.txt"));

    await expect(realCard.getByText("Only csv files supported.")).toBeVisible();
  });

  test("reports mismatched columns before processing starts", async ({ page }) => {
    await page.goto("/input");

    await uploadFile(page, "Real Data", fixture("real.csv"));
    await expectUploadSuccess(page, "Real Data");

    await uploadFile(page, "Synthetic Data", fixture("mismatched.csv"));
    await expectUploadSuccess(page, "Synthetic Data");

    await page.getByRole("button", { name: "Trigger Result Processing" }).click();

    await expect(page.getByText("Processing cannot start:")).toBeVisible();
    await expect(page.getByText(/share only 1 of 3 columns/)).toBeVisible();
    await expect(page.getByText(/computation successful!/)).toHaveCount(0);
  });
});
