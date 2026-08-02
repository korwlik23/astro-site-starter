import { describe, expect, it } from "vitest";

import { parsePreviewSnapshot, previewHeaders } from "../../src/cms/preview";

describe("E4", () => {
  it("accepts only bounded structured preview snapshots", () => {
    const document = parsePreviewSnapshot({
      content: {
        title: "Draft title",
        blocks: [{ type: "text", data: { text: "Draft body" } }],
      },
    });

    expect(document).toMatchObject({ title: "Draft title", kind: "page" });
    expect(parsePreviewSnapshot({ title: "", blocks: [] })).toBeUndefined();
  });

  it("marks preview responses as private and not indexable", () => {
    const headers = previewHeaders();
    expect(headers.get("cache-control")).toBe("no-store");
    expect(headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
});
