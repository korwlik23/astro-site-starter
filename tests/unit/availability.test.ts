import { describe, expect, it } from "vitest";

import { requireAvailableLocale } from "../../src/i18n/availability";
import { localePath } from "../../src/i18n/locale-url";
import type { LocaleRegistry } from "../../src/i18n/locale-registry";

const registry: LocaleRegistry = {
  locales: [
    { code: "en", name: "English", direction: "ltr", enabled: true, selectable: true, default: true },
    { code: "th", name: "ไทย", direction: "ltr", enabled: false, selectable: true, default: false },
  ],
};

describe("S5", () => {
  it("resolves only an exact enabled locale", () => {
    expect(requireAvailableLocale(registry, "en").code).toBe("en");
    expect(() => requireAvailableLocale(registry, "th")).toThrow("not available");
    expect(() => requireAvailableLocale(registry, "fr")).toThrow("not available");
  });

  it("builds a canonical locale-prefixed path", () => {
    expect(localePath("pt-BR")).toBe("/pt-BR/");
    expect(() => localePath("../admin")).toThrow("Invalid locale");
  });
});
