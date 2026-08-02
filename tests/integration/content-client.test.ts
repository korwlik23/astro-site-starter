import { describe, expect, it, vi } from "vitest";

import { PublicAPIClient } from "../../src/api/client";

describe("E1", () => {
  it("keeps public client calls read-only and omits credentials", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));
    const client = new PublicAPIClient("https://api.example.test/api/v1", request);

    await client.listPosts("th", 20);

    expect(request).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ credentials: "omit", method: "GET" }),
    );
    expect(request.mock.calls[0]?.[0].toString()).toBe("https://api.example.test/api/v1/public/posts/th?limit=20");
  });
});
