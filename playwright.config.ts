import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:14322",
  },
  webServer: [
    {
      command: "node tests/fixtures/mock-site-api.mjs",
      url: "http://127.0.0.1:14321/api/v1/locales",
      reuseExistingServer: false,
    },
    {
      command: "pnpm exec astro dev --force --host 127.0.0.1 --port 14322",
      url: "http://127.0.0.1:14322/healthz",
      reuseExistingServer: false,
      env: {
        ASTRO_DEV_BACKGROUND: "1",
        SITE_API_BASE_URL: "http://127.0.0.1:14321/api/v1",
        PUBLIC_SITE_URL: "http://127.0.0.1:14322",
      },
    },
  ],
});
