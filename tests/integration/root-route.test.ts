import { describe, expect, it } from "vitest";

import { createRootRedirect } from "../../src/i18n/root-redirect";
import type { LocaleRegistry } from "../../src/i18n/locale-registry";

const registry: LocaleRegistry = {
  locales: [
    { code: "en", name: "English", direction: "ltr", enabled: true, selectable: true, default: true },
    { code: "th", name: "ไทย", direction: "ltr", enabled: true, selectable: true, default: false },
  ],
};

describe("S4", () => {
  it("redirects the root to the selected locale without caching negotiation", () => {
    const response = createRootRedirect(
      registry,
      new Headers({ cookie: "site_locale=th", "accept-language": "en" }),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/th/");
    expect(response.headers.get("vary")).toBe("Cookie, Accept-Language");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
