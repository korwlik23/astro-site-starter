import type { components } from "../api/generated/public/schema";
import type { LocaleDefinition, LocaleRegistry } from "../i18n/locale-registry";
import { buildCanonicalURL } from "./canonical";

type PublicContent = components["schemas"]["PublicContent"];

export interface VisibleStructuredDataInput {
  siteUrl: string;
  locale: LocaleDefinition;
  registry: LocaleRegistry;
  content: PublicContent;
}

export function buildVisibleStructuredData(input: VisibleStructuredDataInput): Record<string, unknown> {
  const canonical = buildCanonicalURL(input.siteUrl, input.locale, input.content.path, input.content.seo.canonical_url);
  const websiteId = new URL("/#website", input.siteUrl).href;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": new URL("/#organization", input.siteUrl).href,
      name: "Go Lang Starter",
      url: input.siteUrl,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "Go Lang Starter",
      url: input.siteUrl,
      inLanguage: input.locale.code,
      description: input.content.seo.description,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems(input.siteUrl, input.locale, input.content.path, input.content.title),
    },
  ];
  graph.push({
    "@type": input.content.kind === "post" ? "Article" : "WebPage",
    headline: input.content.title,
    name: input.content.title,
    description: input.content.seo.description,
    url: canonical,
    inLanguage: input.locale.code,
    isPartOf: { "@id": websiteId },
    dateModified: input.content.updated_at,
    ...(input.content.published_at === undefined ? {} : { datePublished: input.content.published_at }),
  });
  if (input.content.aeo.question && input.content.aeo.answer) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: [{
        "@type": "Question",
        name: input.content.aeo.question,
        acceptedAnswer: { "@type": "Answer", text: input.content.aeo.answer },
      }],
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function breadcrumbItems(siteUrl: string, locale: LocaleDefinition, path: string, title: string): Record<string, unknown>[] {
  const segments = path.split("/").filter(Boolean);
  const items: Record<string, unknown>[] = [{ "@type": "ListItem", position: 1, name: locale.name, item: new URL(`/${locale.code}/`, siteUrl).href }];
  segments.forEach((segment, index) => items.push({
    "@type": "ListItem",
    position: index + 2,
    name: index === segments.length - 1 ? title : segment,
    item: new URL(`/${locale.code}/${segments.slice(0, index + 1).join("/")}/`, siteUrl).href,
  }));
  return items;
}
