import { describe, expect, it } from "vitest";

import { buildPageMetadata } from "../../src/seo/page-metadata";
import type { LocaleRegistry } from "../../src/i18n/locale-registry";

const registry: LocaleRegistry = {
  locales: [
    { code: "en", name: "English", direction: "ltr", enabled: true, selectable: true, default: true },
    { code: "th", name: "ไทย", direction: "ltr", enabled: true, selectable: true, default: false },
    { code: "ja", name: "日本語", direction: "ltr", enabled: false, selectable: true, default: false },
  ],
};

describe("S8", () => {
  it("builds canonical and hreflang links from the runtime registry", () => {
    const metadata = buildPageMetadata({
      siteUrl: "https://tewarach-dev.me",
      locale: registry.locales[1]!,
      registry,
      title: "ระบบเริ่มต้นสำหรับพัฒนาเว็บ",
      description: "ฐานระบบที่พร้อมต่อยอด",
    });

    expect(metadata.canonical).toBe("https://tewarach-dev.me/th/");
    expect(metadata.alternates).toEqual([
      { href: "https://tewarach-dev.me/en/", hreflang: "en" },
      { href: "https://tewarach-dev.me/th/", hreflang: "th" },
      { href: "https://tewarach-dev.me/en/", hreflang: "x-default" },
    ]);
    expect(metadata.structuredData["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "@type": "Organization" }),
        expect.objectContaining({ "@type": "WebSite", inLanguage: "th" }),
      ]),
    );
  });
});
