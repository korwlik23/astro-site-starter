import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { checkClientBoundaries } from "../../scripts/contracts/check-client-boundaries.mjs";

describe("S9", () => {
  it("allows the public browser client", async () => {
    await expect(
      checkClientBoundaries({
        root: resolve("."),
        entrypoints: [resolve("src/api/client.ts")],
      }),
    ).resolves.toEqual([]);
  });

  it("rejects browser imports of the server-only API client", async () => {
    await expect(
      checkClientBoundaries({
        root: resolve("."),
        entrypoints: [resolve("tests/fixtures/imports/invalid-browser-entry.ts")],
      }),
    ).resolves.toEqual(
      expect.arrayContaining([expect.stringContaining("server-client")]),
    );
  });
});
