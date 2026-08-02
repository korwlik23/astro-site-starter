import { describe, expect, it } from "vitest";

import { normalizePublicPath, requestMatchesETag } from "../../src/cms/route-utils";

describe("E6", () => {
  it("normalizes locale content paths without allowing traversal", () => {
    expect(normalizePublicPath("/docs/getting-started/")).toBe("docs/getting-started");
    expect(normalizePublicPath(undefined)).toBe("");
    expect(() => normalizePublicPath("../private")).toThrow("Public content was not found");
    expect(() => normalizePublicPath("docs\\private")).toThrow("Public content was not found");
  });

  it("only honors an exact published ETag from the request", () => {
    expect(requestMatchesETag(new Request("https://example.test/en/home", { headers: { "if-none-match": '"v2"' } }), '"v2"')).toBe(true);
    expect(requestMatchesETag(new Request("https://example.test/en/home", { headers: { "if-none-match": '"v1"' } }), '"v2"')).toBe(false);
  });
});
