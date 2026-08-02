import type { APIRoute } from "astro";

import { LocaleRegistryUnavailableError } from "../api/errors";
import { getSiteRuntime } from "../runtime/site-runtime";
import { enabledLocales } from "../i18n/locale-registry";
import { buildSitemapIndexXML } from "../seo/sitemap";
import { loadSiteConfig } from "../config/site";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const registry = await getSiteRuntime().locales.get();
    const siteUrl = loadSiteConfig().public.siteUrl;
    const urls = enabledLocales(registry).map((locale) => new URL(`/sitemap/${locale.code}.xml`, siteUrl).href);
    return new Response(buildSitemapIndexXML(urls), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" } });
  } catch (error) {
    if (error instanceof LocaleRegistryUnavailableError) return new Response("Service unavailable", { status: 503, headers: { "cache-control": "no-store" } });
    throw error;
  }
};
