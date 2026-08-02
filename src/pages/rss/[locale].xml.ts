import type { APIRoute } from "astro";

import { APIRequestError, LocaleRegistryUnavailableError } from "../../api/errors";
import { getSiteRuntime } from "../../runtime/site-runtime";
import { loadSiteConfig } from "../../config/site";
import { requireAvailableLocale, LocaleNotAvailableError } from "../../i18n/availability";
import { buildRSSXML } from "../../seo/rss";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const runtime = getSiteRuntime();
    const registry = await runtime.locales.get();
    const locale = requireAvailableLocale(registry, params.locale ?? "");
    const posts = await runtime.publicApi.listPosts(locale.code);
    if (posts.value === undefined) throw new APIRequestError("RSS response is empty", 502);
    return new Response(buildRSSXML(loadSiteConfig().public.siteUrl, locale.code, posts.value.items), { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=300" } });
  } catch (error) {
    if (error instanceof LocaleNotAvailableError || error instanceof APIRequestError && error.status === 404) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
    if (error instanceof LocaleRegistryUnavailableError || error instanceof APIRequestError && error.status >= 500) return new Response("Service unavailable", { status: 503, headers: { "cache-control": "no-store" } });
    throw error;
  }
};
