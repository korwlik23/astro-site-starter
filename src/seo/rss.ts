import type { components } from "../api/generated/public/schema";
import { escapeXML } from "./sitemap";

type PublicPostItem = components["schemas"]["PublicPostItem"];

export function buildRSSXML(siteUrl: string, locale: string, posts: readonly PublicPostItem[]): string {
  const items = posts.map((post) => {
    const link = new URL(`/${locale}/${post.path.replace(/^\/+|\/+$/g, "")}/`, siteUrl).href;
    return `<item><title>${escapeXML(post.title)}</title><link>${escapeXML(link)}</link><guid isPermaLink="true">${escapeXML(link)}</guid><pubDate>${escapeXML(new Date(post.updated_at).toUTCString())}</pubDate></item>`;
  }).join("");
  const link = new URL(`/${locale}/blog/`, siteUrl).href;
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXML(`Go Lang Starter · ${locale}`)}</title><link>${escapeXML(link)}</link><description>${escapeXML(`Published articles for ${locale}`)}</description>${items}</channel></rss>`;
}
