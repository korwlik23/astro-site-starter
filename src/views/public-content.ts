import type { components } from "../api/generated/public/schema";
import type { CatalogEntries } from "../i18n/catalog-schema";
import type { LocaleDefinition, LocaleRegistry } from "../i18n/locale-registry";

export type PublicContent = components["schemas"]["PublicContent"];
export type PublicPostItem = components["schemas"]["PublicPostItem"];

export interface PublicContentProps {
  content: PublicContent;
  locale: LocaleDefinition;
  registry: LocaleRegistry;
  common: CatalogEntries;
}

export interface PublicPostsProps {
  posts: readonly PublicPostItem[];
  locale: LocaleDefinition;
  registry: LocaleRegistry;
  common: CatalogEntries;
}
