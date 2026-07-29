import { SiteServerAPIClient } from "../api/server-client";
import { LocaleRegistryCache } from "../cms/cache/locale-cache";
import { loadSiteConfig } from "../config/site";

export interface SiteRuntime {
  api: SiteServerAPIClient;
  locales: LocaleRegistryCache;
}

let runtime: SiteRuntime | undefined;

export function getSiteRuntime(): SiteRuntime {
  if (runtime) return runtime;
  const config = loadSiteConfig();
  const api = new SiteServerAPIClient(config.server.apiBaseUrl);
  runtime = {
    api,
    locales: new LocaleRegistryCache(() => api.listLocales(), { ttlMs: 60_000 }),
  };
  return runtime;
}
