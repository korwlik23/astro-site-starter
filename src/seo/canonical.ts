import { localePath } from "../i18n/locale-url";
import type { LocaleDefinition } from "../i18n/locale-registry";

export function buildCanonicalURL(siteUrl: string, locale: LocaleDefinition, path = "", override?: string): string {
  if (override !== undefined && override.trim() !== "") return new URL(override, siteUrl).href;
  return new URL(localePath(locale.code, path), siteUrl).href;
}
