import { defaultLocale, enabledLocales, type LocaleDefinition, type LocaleRegistry } from "../i18n/locale-registry";
import { localePath } from "../i18n/locale-url";

export interface PageMetadataInput {
  siteUrl: string;
  locale: LocaleDefinition;
  registry: LocaleRegistry;
  title: string;
  description: string;
}

export function buildPageMetadata(input: PageMetadataInput) {
  const canonical = new URL(localePath(input.locale.code), input.siteUrl).href;
  const alternates = enabledLocales(input.registry).map((locale) => ({
    hreflang: locale.code,
    href: new URL(localePath(locale.code), input.siteUrl).href,
  }));
  const fallback = defaultLocale(input.registry);
  alternates.push({
    hreflang: "x-default",
    href: new URL(localePath(fallback.code), input.siteUrl).href,
  });

  const organizationId = new URL("/#organization", input.siteUrl).href;
  const websiteId = new URL("/#website", input.siteUrl).href;
  return {
    canonical,
    alternates,
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": organizationId,
          name: "Go Lang Starter",
          url: input.siteUrl,
        },
        {
          "@type": "WebSite",
          "@id": websiteId,
          name: "Go Lang Starter",
          url: input.siteUrl,
          inLanguage: input.locale.code,
          publisher: { "@id": organizationId },
          description: input.description,
        },
        {
          "@type": "WebPage",
          name: input.title,
          description: input.description,
          url: canonical,
          inLanguage: input.locale.code,
          isPartOf: { "@id": websiteId },
        },
      ],
    },
  };
}

export function serializeStructuredData(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
