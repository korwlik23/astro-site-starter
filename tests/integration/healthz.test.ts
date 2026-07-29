import { describe, expect, it } from "vitest";

import { GET } from "../../src/pages/healthz";

describe("S7", () => {
  it("returns a minimal non-cacheable liveness response", async () => {
    const response = GET();
    const text = await response.clone().text();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "ok" });
    expect(text).not.toMatch(/version|database|secret|dependency/i);
  });
});
