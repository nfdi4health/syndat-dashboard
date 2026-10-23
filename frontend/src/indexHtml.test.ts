import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const indexHtmlPath = resolve(process.cwd(), "index.html");

describe("index.html", () => {
  const html = readFileSync(indexHtmlPath, "utf8");

  test("loads the Google Analytics gtag script", () => {
    expect(html).toContain("https://www.googletagmanager.com/gtag/js?id=G-1J364P2R8H");
  });

  test("configures the Google Analytics measurement id", () => {
    expect(html).toContain('gtag("config", "G-1J364P2R8H")');
  });
});
