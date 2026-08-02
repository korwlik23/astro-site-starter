import { describe, expect, it } from "vitest";

import { buildRSSXML } from "../../src/seo/rss";
import { buildSitemapIndexXML, buildSitemapXML } from "../../src/seo/sitemap";

describe("E6", () => {
  it("emits only public locale and published post URLs in feeds", () => {
    const sitemap = buildSitemapXML([{ loc: "https://example.test/th/" }, { loc: "https://example.test/th/blog/hello/" }]);
    expect(sitemap).toContain("/th/");
    expect(sitemap).toContain("/th/blog/hello/");
    expect(sitemap).not.toContain("preview");
    expect(buildSitemapIndexXML(["https://example.test/sitemap/en.xml"])).toContain("sitemap/en.xml");
    expect(buildRSSXML("https://example.test", "th", [])).toContain("<rss");
  });
});
