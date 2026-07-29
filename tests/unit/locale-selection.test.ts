import { describe, expect, it } from "vitest";

import type { LocaleRegistry } from "../../src/i18n/locale-registry";
import { selectLocale } from "../../src/i18n/select-locale";

const registry: LocaleRegistry = {
  locales: [
    { code: "en", name: "English", direction: "ltr", enabled: true, selectable: true, default: true },
    { code: "th", name: "ไทย", direction: "ltr", enabled: true, selectable: true, default: false },
    { code: "ja", name: "日本語", direction: "ltr", enabled: false, selectable: true, default: false },
  ],
};

describe("S3", () => {
  it("selects an enabled cookie locale before the request language", () => {
    expect(selectLocale(registry, "site_locale=th", "en-US,en;q=0.9")).toBe("th");
  });

  it("uses the best enabled Accept-Language match when the cookie is invalid", () => {
    expect(selectLocale(registry, "site_locale=ja", "ja;q=1, th-TH;q=0.8, en;q=0.5")).toBe("th");
  });

  it("falls back to the enabled system default", () => {
    expect(selectLocale(registry, undefined, "de-DE,de;q=0.9")).toBe("en");
  });
});
