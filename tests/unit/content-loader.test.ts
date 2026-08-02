import { describe, expect, it, vi } from "vitest";

import { PublicAPIClient } from "../../src/api/client";
import type { components } from "../../src/api/generated/public/schema";
import { APIRequestError } from "../../src/api/errors";
import { PublicContentLoader } from "../../src/cms/content-loader";

type PublicContent = components["schemas"]["PublicContent"];

const content: PublicContent = {
  aeo: { answer: "A bounded answer", question: "What is this?" },
  alternates: [],
  blocks: [{ type: "text", data: { text: "Hello" } }],
  content_id: "content-1",
  content_key: "home",
  content_status: "published",
  content_version: 4,
  excerpt: "Summary",
  geo: { locality: "Bangkok", region: "TH" },
  kind: "page",
  locale_id: "locale-en",
  path: "home",
  seo: { description: "Summary", title: "Home" },
  slug: "home",
  title: "Home",
  translation_id: "translation-1",
  translation_status: "published",
  translation_version: 2,
  updated_at: "2026-08-02T00:00:00Z",
};

describe("E1", () => {
  it("loads a typed content response and preserves cache headers", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(content), {
      status: 200,
      headers: { "content-type": "application/json", etag: '"content-v4"', "cache-control": "public, max-age=60" },
    }));
    const client = new PublicAPIClient("https://api.example.test/api/v1", request);
    const response = await client.getContent("en", "docs/getting-started");

    expect(response.value).toEqual(content);
    expect(response.etag).toBe('"content-v4"');
    expect(request.mock.calls[0]?.[0].toString()).toBe("https://api.example.test/api/v1/public/content/en/docs/getting-started");
  });

  it("maps not-found and timeout failures to bounded API errors", async () => {
    const notFound = new PublicAPIClient("https://api.example.test/api/v1", vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(notFound.getContent("en", "missing")).rejects.toMatchObject({ status: 404 });

    const unavailable = new PublicAPIClient("https://api.example.test/api/v1", vi.fn<typeof fetch>().mockRejectedValue(new Error("socket detail")));
    await expect(unavailable.getContent("en", "home")).rejects.toBeInstanceOf(APIRequestError);
    await expect(unavailable.getContent("en", "home")).rejects.toMatchObject({ status: 503 });
  });

  it("uses ETag revalidation and serves the cached value on 304", async () => {
    let now = 1_000;
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(content), { status: 200, headers: { etag: '"content-v4"' } }))
      .mockResolvedValueOnce(new Response(null, { status: 304, headers: { etag: '"content-v4"' } }));
    const client = new PublicAPIClient("https://api.example.test/api/v1", request);
    const loader = new PublicContentLoader(client, { ttlMs: 100, staleIfErrorMs: 200, now: () => now, siteKey: "site" });

    await expect(loader.get("en", "home")).resolves.toMatchObject({ content, stale: false, cacheKey: "site|en|home|v4" });
    now = 1_101;
    await expect(loader.get("en", "home")).resolves.toMatchObject({ content, stale: false });
    expect(new Headers(request.mock.calls[1]?.[1]?.headers).get("if-none-match")).toBe('"content-v4"');
  });
});
