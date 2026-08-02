import { describe, expect, it } from "vitest";

import { resolveBlockRenderer, visibleBlocks } from "../../src/blocks/registry";

describe("E2", () => {
  it("keeps only allowlisted structured block types", () => {
    const blocks = visibleBlocks([
      { type: "text", data: { text: "Visible" } },
      { type: "unknown", data: { html: "<script>" } },
      { type: "image", data: { src: "/media/a", alt: "A", width: 100, height: 80 } },
    ]);

    expect(blocks).toHaveLength(2);
    expect(resolveBlockRenderer("unknown")).toBeUndefined();
    expect(resolveBlockRenderer("answer")).toBe("answer");
  });

  it("does not manufacture block output for malformed values", () => {
    expect(visibleBlocks([null, "text", { type: "text" }, { type: "text", data: [] }])).toEqual([]);
  });
});
