export type TextDirection = "ltr" | "rtl";

export interface LocaleDefinition {
  id?: string;
  code: string;
  name: string;
  direction: TextDirection;
  enabled: boolean;
  selectable: boolean;
  default: boolean;
}

export interface LocaleRegistry {
  locales: LocaleDefinition[];
}

export function enabledLocales(registry: LocaleRegistry): LocaleDefinition[] {
  return registry.locales.filter((locale) => locale.enabled);
}

export function findEnabledLocale(
  registry: LocaleRegistry,
  requestedCode: string,
): LocaleDefinition | undefined {
  const normalized = requestedCode.trim().toLowerCase();
  const base = normalized.split("-")[0] ?? normalized;
  return enabledLocales(registry).find((locale) => {
    const code = locale.code.toLowerCase();
    return code === normalized || code === base;
  });
}

export function defaultLocale(registry: LocaleRegistry): LocaleDefinition {
  const locale = enabledLocales(registry).find((candidate) => candidate.default);
  if (!locale) {
    throw new Error("Locale registry has no enabled system default");
  }
  return locale;
}
