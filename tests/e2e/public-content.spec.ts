import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

import { expectReadableBody, visualDirectory } from "./visual-helpers";

const contentPath = "/en/guides/platform/";

test("CMS pilot renders long text inside the shared localized shell", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const response = await page.goto(contentPath, { waitUntil: "networkidle" });

  expect(response?.status()).toBe(200);
  await expect(page.locator("main#main")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Platform guide" })).toBeVisible();
  await expect(page.locator(".breadcrumbs")).toContainText("Home");
  await expect(page.locator(".text-block")).toContainText("deterministic publishing workflow");
  await expect(page.getByRole("link", { name: "TH", exact: true })).toHaveAttribute(
    "href",
    "/th/guides/platform/",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://127.0.0.1:14322/en/guides/platform/",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("public response contract preserves cache, ETag, and exact 304 semantics", async ({ request }) => {
  const first = await request.get(contentPath);
  expect(first.status()).toBe(200);
  expect(first.headers()["cache-control"]).toBe("public, max-age=60, stale-while-revalidate=120");
  expect(first.headers().etag).toBe('"content-v2"');

  const conditional = await request.get(contentPath, {
    headers: { "if-none-match": '"content-v2"' },
  });
  expect(conditional.status()).toBe(304);
  expect(conditional.headers().etag).toBe('"content-v2"');
});

test("captures the CMS visual approval matrix", async ({ page }) => {
  test.setTimeout(120_000);
  const output = await visualDirectory("site");
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(contentPath, { waitUntil: "networkidle" });
      await expectReadableBody(page);
      await page.screenshot({
        path: resolve(output, `cms-en-ltr-${width}-${theme}.png`),
        fullPage: true,
      });
    }
  }
});
