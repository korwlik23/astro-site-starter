import type { components } from "../api/generated/public/schema";
import { enabledLocales, type LocaleDefinition, type LocaleRegistry } from "../i18n/locale-registry";
import { localePath } from "../i18n/locale-url";

type PublicAlternate = components["schemas"]["PublicAlternate"];

export function buildHreflangLinks(
  siteUrl: string,
  locale: LocaleDefinition,
  registry: LocaleRegistry,
  path: string,
  alternates?: readonly PublicAlternate[],
): { hreflang: string; href: string }[] {
  const enabled = enabledLocales(registry);
  const allowedCodes = alternates === undefined
    ? new Set(enabled.map((item) => item.code))
    : new Set([
      locale.code,
      ...alternates.map((alternate) => enabled.find((item) => item.id !== undefined && item.id === alternate.locale_id)?.code).filter((code): code is string => code !== undefined),
    ]);
  const candidates = enabled.filter((item) => allowedCodes.has(item.code));
  const ordered = alternates === undefined ? candidates : [
    ...candidates.filter((item) => item.code === locale.code),
    ...candidates.filter((item) => item.code !== locale.code),
  ];
  const links = ordered.map((item) => {
    const alternate = alternates?.find((candidate) => candidate.locale_id === item.id);
    const targetPath = item.code === locale.code ? path : alternate?.path ?? path;
    return { hreflang: item.code, href: new URL(localePath(item.code, targetPath), siteUrl).href };
  });
  const fallback = enabled.find((item) => item.default && allowedCodes.has(item.code));
  if (fallback) links.push({ hreflang: "x-default", href: new URL(localePath(fallback.code, fallback.code === locale.code ? path : alternates?.find((item) => item.locale_id === fallback.id)?.path ?? path), siteUrl).href });
  return links;
}
