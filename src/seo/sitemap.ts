export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

export function buildSitemapXML(entries: readonly SitemapEntry[]): string {
  const body = entries.map((entry) => `<url><loc>${escapeXML(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${escapeXML(entry.lastmod)}</lastmod>` : ""}</url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function buildSitemapIndexXML(urls: readonly string[]): string {
  const body = urls.map((url) => `<sitemap><loc>${escapeXML(url)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

export function escapeXML(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
