import {
  defaultLocale,
  findEnabledLocale,
  type LocaleRegistry,
} from "./locale-registry";

const localeCookieName = "site_locale";

export function selectLocale(
  registry: LocaleRegistry,
  cookieHeader?: string,
  acceptLanguageHeader?: string,
): string {
  const cookieLocale = readCookie(cookieHeader, localeCookieName);
  if (cookieLocale) {
    const match = findEnabledLocale(registry, cookieLocale);
    if (match) return match.code;
  }

  for (const requested of parseAcceptLanguage(acceptLanguageHeader)) {
    const match = findEnabledLocale(registry, requested);
    if (match) return match.code;
  }

  return defaultLocale(registry).code;
}

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function parseAcceptLanguage(header: string | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part, index) => {
      const [language = "", ...parameters] = part.trim().split(";");
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const parsedQuality = qualityParameter
        ? Number(qualityParameter.trim().slice(2))
        : 1;
      return {
        language,
        quality:
          Number.isFinite(parsedQuality) && parsedQuality >= 0 && parsedQuality <= 1
            ? parsedQuality
            : 0,
        index,
      };
    })
    .filter(({ language, quality }) => language !== "*" && language !== "" && quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index)
    .map(({ language }) => language);
}
