import { describe, expect, it } from "vitest";

import {
  buildPrimaryNavigation,
  languagePath,
  normalizeCurrentPath,
} from "../../src/components/site/navigation-model";

const navigation = {
  primary_label: "Primary navigation",
  features: "Features",
  architecture: "Architecture",
  faq: "FAQ",
};

describe("localized navigation model", () => {
  it("contains only the approved home-section information architecture", () => {
    expect(buildPrimaryNavigation("en", navigation)).toEqual([
      { id: "features", label: "Features", href: "/en/#features" },
      { id: "architecture", label: "Architecture", href: "/en/#architecture" },
      { id: "faq", label: "FAQ", href: "/en/#faq" },
    ]);
  });

  it.each([
    ["", ""],
    ["/", ""],
    ["blog", "blog"],
    ["/blog/", "blog"],
    ["guides/getting-started", "guides/getting-started"],
  ])("normalizes current path %s", (input, output) => {
    expect(normalizeCurrentPath(input)).toBe(output);
  });

  it("preserves home, blog, and content paths when switching language", () => {
    expect(languagePath("th", "")).toBe("/th/");
    expect(languagePath("th", "blog")).toBe("/th/blog/");
    expect(languagePath("th", "guides/getting-started")).toBe("/th/guides/getting-started/");
  });

  it("rejects traversal instead of falling back to a different language path", () => {
    expect(() => languagePath("th", "../private")).toThrow("current path");
  });
});
