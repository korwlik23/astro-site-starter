import type { components } from "../api/generated/public/schema";
import { type LocaleDefinition, type LocaleRegistry } from "../i18n/locale-registry";
import { buildCanonicalURL } from "./canonical";
import { buildHreflangLinks } from "./hreflang";
import { buildVisibleStructuredData } from "./json-ld";

type PublicContent = components["schemas"]["PublicContent"];

export interface PageMetadataInput {
  siteUrl: string;
  locale: LocaleDefinition;
  registry: LocaleRegistry;
  title: string;
  description: string;
  path?: string;
  content?: PublicContent;
}

export function buildPageMetadata(input: PageMetadataInput) {
  const path = input.path ?? input.content?.path ?? "";
  const canonical = buildCanonicalURL(input.siteUrl, input.locale, path, input.content?.seo.canonical_url);
  const alternates = buildHreflangLinks(input.siteUrl, input.locale, input.registry, path, input.content?.alternates);
  return {
    canonical,
    alternates,
    structuredData: input.content === undefined
      ? buildSiteStructuredData(input.siteUrl, input.locale, input.title, input.description, canonical)
      : buildVisibleStructuredData({ siteUrl: input.siteUrl, locale: input.locale, registry: input.registry, content: input.content }),
  };
}

export function serializeStructuredData(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function buildSiteStructuredData(siteUrl: string, locale: LocaleDefinition, title: string, description: string, canonical: string) {
  const organizationId = new URL("/#organization", siteUrl).href;
  const websiteId = new URL("/#website", siteUrl).href;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": organizationId, name: "Go Lang Starter", url: siteUrl },
      { "@type": "WebSite", "@id": websiteId, name: "Go Lang Starter", url: siteUrl, inLanguage: locale.code, publisher: { "@id": organizationId }, description },
      { "@type": "WebPage", name: title, description, url: canonical, inLanguage: locale.code, isPartOf: { "@id": websiteId } },
    ],
  };
}
