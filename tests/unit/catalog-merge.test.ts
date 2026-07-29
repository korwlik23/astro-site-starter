import { describe, expect, it } from "vitest";

import { mergeCatalog } from "../../src/i18n/merge-catalog";

describe("S6", () => {
  it("applies API overrides above the target bundle and fallback bundle", () => {
    expect(
      mergeCatalog(
        { title: "Welcome", shared: "Fallback", fallback_only: "English only" },
        { title: "ยินดีต้อนรับ", shared: "ภาษาไทย" },
        { title: "สวัสดี" },
      ),
    ).toEqual({
      title: "สวัสดี",
      shared: "ภาษาไทย",
      fallback_only: "English only",
    });
  });

  it("rejects prototype mutation keys and non-string values", () => {
    expect(() => mergeCatalog({}, {}, { constructor: "unsafe" })).toThrow("catalog");
    expect(() =>
      mergeCatalog({}, {}, { safe: 123 } as unknown as Record<string, string>),
    ).toThrow("catalog");
  });
});
