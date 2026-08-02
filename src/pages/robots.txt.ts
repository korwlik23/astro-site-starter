import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site?.href ?? "https://example.invalid/";
  return new Response(`User-agent: *\nAllow: /\nDisallow: /preview/\nDisallow: /admin/\nSitemap: ${new URL("/sitemap-index.xml", siteUrl).href}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
};
