import type { SiteServerAPIClient } from "../api/server-client";
import { validateCatalog, type CatalogCategory, type CatalogEntries } from "./catalog-schema";
import { mergeCatalog } from "./merge-catalog";

import enCommon from "../locales/en/common.json";
import enForms from "../locales/en/forms.json";
import enMarketing from "../locales/en/marketing.json";
import enNavigation from "../locales/en/navigation.json";
import thCommon from "../locales/th/common.json";
import thForms from "../locales/th/forms.json";
import thMarketing from "../locales/th/marketing.json";
import thNavigation from "../locales/th/navigation.json";

const englishBundle: Record<CatalogCategory, CatalogEntries> = {
  common: enCommon,
  forms: enForms,
  marketing: enMarketing,
  navigation: enNavigation,
};

const bundled: Record<string, Record<CatalogCategory, CatalogEntries>> = {
  en: englishBundle,
  th: { common: thCommon, forms: thForms, marketing: thMarketing, navigation: thNavigation },
};

export function bundledCatalog(locale: string, category: CatalogCategory): CatalogEntries {
  return { ...englishBundle[category], ...(bundled[locale]?.[category] ?? {}) };
}

export async function loadCatalog(
  client: SiteServerAPIClient,
  locale: string,
  category: CatalogCategory,
): Promise<CatalogEntries> {
  const remote = await client.getCatalog(locale, category);
  if (remote.locale.toLowerCase() !== locale.toLowerCase() || remote.category !== category) {
    throw new Error("Catalog response identity does not match the request");
  }
  return mergeCatalog(
    englishBundle[category],
    bundled[locale]?.[category] ?? {},
    validateCatalog(remote.entries),
  );
}
