import { defineMiddleware } from "astro:middleware";

import { LocaleRegistryUnavailableError } from "./api/errors";
import { requireAvailableLocale, LocaleNotAvailableError } from "./i18n/availability";
import { getSiteRuntime } from "./runtime/site-runtime";

const unlocalizedPaths = new Set(["", "healthz"]);

export const onRequest = defineMiddleware(async ({ url }, next) => {
  const firstSegment = url.pathname.split("/").filter(Boolean)[0] ?? "";
  if (unlocalizedPaths.has(firstSegment) || firstSegment.startsWith("_")) {
    return next();
  }

  try {
    const registry = await getSiteRuntime().locales.get();
    requireAvailableLocale(registry, firstSegment);
    return next();
  } catch (error) {
    if (error instanceof LocaleNotAvailableError) {
      return new Response("Not found", { status: 404 });
    }
    if (error instanceof LocaleRegistryUnavailableError) {
      return new Response("Service unavailable", {
        status: 503,
        headers: { "cache-control": "no-store" },
      });
    }
    throw error;
  }
});
