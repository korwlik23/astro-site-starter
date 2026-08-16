import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

import { expectReadableBody, visualDirectory } from "./visual-helpers";

test("header renders one desktop navigation model", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/en/", { waitUntil: "networkidle" });

  await expect(page.locator(".desktop-navigation")).toBeVisible();
  await expect(page.locator(".mobile-navigation")).toBeHidden();
  await expect(page.locator(".desktop-navigation a")).toHaveCount(3);
});

for (const width of [320, 375, 414, 768]) {
  test(`mobile navigation remains operable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/en/", { waitUntil: "networkidle" });

    const summary = page.locator(".mobile-navigation summary");
    await expect(summary).toBeVisible();
    const summaryBox = await summary.boundingBox();
    expect(summaryBox?.height).toBeGreaterThanOrEqual(44);
    await summary.click();

    const navigation = page.locator(".mobile-navigation nav");
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("link")).toHaveCount(3);
    const firstLinkBox = await navigation.getByRole("link").first().boundingBox();
    expect(firstLinkBox?.height).toBeGreaterThanOrEqual(44);

    await page.keyboard.press("Escape");
    await expect(navigation).toBeHidden();
    await expect(summary).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("shell honors reduced motion and dark color scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/en/", { waitUntil: "networkidle" });
  expect(await page.locator("html").evaluate((node) => getComputedStyle(node).scrollBehavior)).toBe("auto");
  expect(await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe("rgb(246, 243, 236)");
});

test("footer is a localized contentinfo landmark", async ({ page }) => {
  await page.goto("/th/", { waitUntil: "networkidle" });
  const footer = page.locator(".site-footer");
  await expect(footer).toHaveRole("contentinfo");
  await expect(footer).toContainText("Go Lang Starter");
  await expect(footer).toContainText("สร้างขึ้นเพื่อการต่อยอด");
});

test("landmarks and SEO metadata pass through the shared site layout", async ({ page }) => {
  await page.goto("/en/", { waitUntil: "networkidle" });
  await expect(page.locator("header.site-header")).toHaveCount(1);
  await expect(page.locator("main#main")).toHaveCount(1);
  await expect(page.locator("footer.site-footer")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en\/$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow, max-image-preview:large");
});

test("captures localized home and mobile-menu visual approval matrices", async ({ page }) => {
  test.setTimeout(180_000);
  const output = await visualDirectory("site");
  const locales = [
    { code: "en", direction: "ltr" },
    { code: "th", direction: "ltr" },
    { code: "ar", direction: "rtl" },
  ];
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const locale of locales) {
        await page.goto(`/${locale.code}/`, { waitUntil: "networkidle" });
        await expect(page.locator("html")).toHaveAttribute("dir", locale.direction);
        await expectReadableBody(page);
        await page.screenshot({
          path: resolve(output, `home-${locale.code}-${locale.direction}-${width}-${theme}.png`),
          fullPage: true,
        });
      }
      if (width < 1024) {
        await page.goto("/en/", { waitUntil: "networkidle" });
        await page.locator(".mobile-navigation summary").click();
        await page.screenshot({
          path: resolve(output, `mobile-menu-en-${width}-${theme}.png`),
          fullPage: true,
        });
      }
    }
  }
});
