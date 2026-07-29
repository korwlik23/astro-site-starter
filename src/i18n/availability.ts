import { findEnabledLocale, type LocaleDefinition, type LocaleRegistry } from "./locale-registry";

export class LocaleNotAvailableError extends Error {
  readonly status = 404;

  constructor() {
    super("Requested locale is not available");
    this.name = "LocaleNotAvailableError";
  }
}

export function requireAvailableLocale(
  registry: LocaleRegistry,
  code: string,
): LocaleDefinition {
  const locale = findEnabledLocale(registry, code);
  if (!locale || locale.code.toLowerCase() !== code.toLowerCase()) {
    throw new LocaleNotAvailableError();
  }
  return locale;
}
