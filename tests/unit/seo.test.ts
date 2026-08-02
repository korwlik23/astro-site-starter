import { describe, expect, it } from "vitest";

import { buildPageMetadata } from "../../src/seo/page-metadata";
import { buildRSSXML } from "../../src/seo/rss";
import { buildSitemapXML } from "../../src/seo/sitemap";
import type { components } from "../../src/api/generated/public/schema";
import type { LocaleRegistry } from "../../src/i18n/locale-registry";

type PublicContent = components["schemas"]["PublicContent"];

const registry: LocaleRegistry = {
  locales: [
    { id: "locale-en", code: "en", name: "English", direction: "ltr", enabled: true, selectable: true, default: true },
    { id: "locale-th", code: "th", name: "Thai", direction: "ltr", enabled: true, selectable: true, default: false },
  ],
};

const content: PublicContent = {
  aeo: { question: "What?", answer: "This." }, alternates: [{ locale_id: "locale-en", path: "docs/home", slug: "home", title: "Home", translation_id: "translation-en" }],
  blocks: [{ type: "text", data: { text: "Visible" } }], content_id: "content-1", content_key: "home", content_status: "published", content_version: 2, excerpt: "Excerpt", geo: {}, kind: "post", locale_id: "locale-th", path: "blog/home", seo: { description: "Desc", title: "Title" }, slug: "home", title: "Title", translation_id: "translation-th", translation_status: "published", translation_version: 1, updated_at: "2026-08-02T00:00:00Z",
};

describe("E5", () => {
  it("limits content hreflang and JSON-LD to published visible data", () => {
    const metadata = buildPageMetadata({ siteUrl: "https://example.test", locale: registry.locales[1]!, registry, title: "Title", description: "Desc", content });
    expect(metadata.canonical).toBe("https://example.test/th/blog/home/");
    expect(metadata.alternates).toEqual([
      { hreflang: "th", href: "https://example.test/th/blog/home/" },
      { hreflang: "en", href: "https://example.test/en/docs/home/" },
      { hreflang: "x-default", href: "https://example.test/en/docs/home/" },
    ]);
    expect(metadata.structuredData["@graph"]).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "Article" }),
      expect.objectContaining({ "@type": "FAQPage" }),
    ]));
  });

  it("escapes sitemap and RSS values", () => {
    expect(buildSitemapXML([{ loc: "https://example.test/en/a?x=1&y=2" }])).toContain("&amp;");
    expect(buildRSSXML("https://example.test", "en", [{ content_id: "1", locale_id: "l", path: "blog/a", slug: "a", title: "A & B", translation_id: "t", updated_at: "2026-08-02T00:00:00Z" }])).toContain("A &amp; B");
  });
});
