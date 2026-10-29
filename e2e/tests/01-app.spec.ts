import { expect, test } from "@playwright/test";
import { E2E_API_URL, navigateTo } from "./helpers";

test.describe("app shell", () => {
  test("serves the single page app with header navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/SYNDAT/i);
    await expect(page.getByRole("heading", { name: "About" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How to Use" })).toBeVisible();

    await navigateTo(page, "Input");
    await expect(
      page.getByRole("heading", { name: "Data Upload & Processing" })
    ).toBeVisible();

    await navigateTo(page, "Results");
    await expect(
      page.getByRole("heading", { name: "Quality Evaluation" })
    ).toBeVisible();
  });

  test("shows the backend version in the header", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("App Version: 1.0.0")).toBeVisible();
  });

  test("exposes the documented backend API contract", async ({ request }) => {
    const version = await request.get(`${E2E_API_URL}/version`);
    expect(version.ok()).toBeTruthy();
    expect(await version.json()).toBe("1.0.0");

    const datasets = await request.get(`${E2E_API_URL}/datasets`);
    expect(datasets.ok()).toBeTruthy();
    expect(Array.isArray(await datasets.json())).toBeTruthy();

    // The `default` dataset ships with the backend, so its stored results must
    // be readable without running any processing first.
    const results = [
      { path: "results/auc", key: "auc_score" },
      { path: "results/jsd", key: "jsd_score" },
      { path: "results/norm", key: "norm" },
      { path: "results/risk_singling_out", key: "risk" },
      { path: "results/risk_linkability", key: "risk" },
      { path: "results/risk_inference", key: "risk" },
    ];
    for (const { path, key } of results) {
      const response = await request.get(`${E2E_API_URL}/datasets/default/${path}`);
      expect(response.ok(), `${path} should return 200`).toBeTruthy();
      const body = await response.json();
      expect(body, `${path} should expose "${key}"`).toHaveProperty(key);
    }

    const validation = await request.get(
      `${E2E_API_URL}/datasets/default/patients/validation`
    );
    expect(validation.ok()).toBeTruthy();
    expect(await validation.json()).toHaveProperty("valid");
  });
});
