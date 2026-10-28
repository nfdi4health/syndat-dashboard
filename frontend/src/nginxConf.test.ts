import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const nginxConfPath = resolve(process.cwd(), "nginx.conf.template");

describe("nginx.conf.template", () => {
  const conf = readFileSync(nginxConfPath, "utf8");

  test("does not cache the index.html entrypoint", () => {
    const indexBlock = conf.match(/location = \/index\.html \{[\s\S]*?\}/);
    expect(indexBlock).not.toBeNull();
    expect(indexBlock![0]).toContain(
      'Cache-Control "no-store, no-cache, must-revalidate"',
    );
    expect(indexBlock![0]).toContain('Pragma "no-cache"');
    expect(indexBlock![0]).toContain('Expires "0"');
  });

  test("caches content-hashed assets immutably", () => {
    const assetsBlock = conf.match(/location \/assets\/ \{[\s\S]*?\}/);
    expect(assetsBlock).not.toBeNull();
    expect(assetsBlock![0]).toContain(
      'Cache-Control "public, max-age=31536000, immutable"',
    );
  });

  test("disables caching for the default location", () => {
    const defaultBlock = conf.match(/location \/ \{[\s\S]*?\}/);
    expect(defaultBlock).not.toBeNull();
    expect(defaultBlock![0]).toContain(
      'Cache-Control "no-store, no-cache, must-revalidate"',
    );
  });
});
