import type { APIRoute } from "astro";

import { APIRequestError, LocaleRegistryUnavailableError } from "../../api/errors";
import { buildSitemapXML } from "../../seo/sitemap";
import { getSiteRuntime } from "../../runtime/site-runtime";
import { loadSiteConfig } from "../../config/site";
import { requireAvailableLocale, LocaleNotAvailableError } from "../../i18n/availability";
import { localePath } from "../../i18n/locale-url";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const runtime = getSiteRuntime();
    const registry = await runtime.locales.get();
    const locale = requireAvailableLocale(registry, params.locale ?? "");
    const posts = await runtime.publicApi.listPosts(locale.code);
    if (posts.value === undefined) throw new APIRequestError("Sitemap response is empty", 502);
    const siteUrl = loadSiteConfig().public.siteUrl;
    const entries = [
      { loc: new URL(localePath(locale.code), siteUrl).href },
      { loc: new URL(localePath(locale.code, "blog"), siteUrl).href },
      ...posts.value.items.map((post) => ({ loc: new URL(localePath(locale.code, post.path), siteUrl).href, lastmod: post.updated_at })),
    ];
    return new Response(buildSitemapXML(entries), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" } });
  } catch (error) {
    if (error instanceof LocaleNotAvailableError || error instanceof APIRequestError && error.status === 404) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
    if (error instanceof LocaleRegistryUnavailableError || error instanceof APIRequestError && error.status >= 500) return new Response("Service unavailable", { status: 503, headers: { "cache-control": "no-store" } });
    throw error;
  }
};
