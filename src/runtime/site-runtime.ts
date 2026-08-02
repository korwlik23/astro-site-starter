import { PublicAPIClient } from "../api/client";
import { SiteServerAPIClient } from "../api/server-client";
import { LocaleRegistryCache } from "../cms/cache/locale-cache";
import { PublicContentLoader } from "../cms/content-loader";
import { loadSiteConfig } from "../config/site";

export interface SiteRuntime {
  api: SiteServerAPIClient;
  publicApi: PublicAPIClient;
  locales: LocaleRegistryCache;
  content: PublicContentLoader;
}

let runtime: SiteRuntime | undefined;

export function getSiteRuntime(): SiteRuntime {
  if (runtime) return runtime;
  const config = loadSiteConfig();
  const api = new SiteServerAPIClient(config.server.apiBaseUrl);
  const publicApi = new PublicAPIClient(config.server.apiBaseUrl);
  runtime = {
    api,
    publicApi,
    locales: new LocaleRegistryCache(() => api.listLocales(), { ttlMs: 60_000 }),
    content: new PublicContentLoader(publicApi, {
      ttlMs: 60_000,
      staleIfErrorMs: 120_000,
      siteKey: config.public.siteUrl,
    }),
  };
  return runtime;
}
