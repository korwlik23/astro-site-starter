import { expect, test } from "@playwright/test";

test("serves an unlocalized health endpoint", async ({ request }) => {
  const response = await request.get("/healthz");

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});

test("redirects the root to the configured default locale", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/en\/$/);
});

test("renders a localized page with a language switcher", async ({ page }) => {
  await page.goto("/en/", { waitUntil: "networkidle" });

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.getByRole("link", { name: "TH", exact: true })).toHaveAttribute(
    "href",
    "/th/",
  );
});

test("publishes robots and sitemap discovery endpoints", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  await expect(robots.text()).resolves.toContain("Sitemap:");

  const sitemap = await request.get("/sitemap-index.xml");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toContain("application/xml");
  await expect(sitemap.text()).resolves.toContain("/sitemap/en.xml");
});
