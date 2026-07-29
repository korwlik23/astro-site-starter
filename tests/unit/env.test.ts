import { afterEach, describe, expect, it, vi } from "vitest";

import { parseSiteEnvironment } from "../../src/config/env";
import { loadSiteConfig } from "../../src/config/site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("S2", () => {
  it("separates server settings from the public site origin", () => {
    expect(
      parseSiteEnvironment({
        SITE_API_BASE_URL: "https://api.tewarach-dev.me/api/v1",
        PUBLIC_SITE_URL: "https://tewarach-dev.me",
      }),
    ).toEqual({
      server: { apiBaseUrl: "https://api.tewarach-dev.me/api/v1" },
      public: { siteUrl: "https://tewarach-dev.me" },
    });
  });

  it("rejects secret-like values in the public namespace", () => {
    expect(() =>
      parseSiteEnvironment({
        SITE_API_BASE_URL: "https://api.tewarach-dev.me/api/v1",
        PUBLIC_SITE_URL: "https://tewarach-dev.me",
        PUBLIC_API_TOKEN: "must-not-leak",
      }),
    ).toThrow("PUBLIC_API_TOKEN");
  });

  it("loads server configuration from the runtime process environment", () => {
    vi.stubEnv("SITE_API_BASE_URL", "http://127.0.0.1:8080/api/v1");
    vi.stubEnv("PUBLIC_SITE_URL", "https://tewarach-dev.me");

    expect(loadSiteConfig().server.apiBaseUrl).toBe("http://127.0.0.1:8080/api/v1");
  });
});
