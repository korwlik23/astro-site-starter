import { describe, expect, it, vi } from "vitest";

import { PublicContentUnavailableError } from "../../src/api/errors";
import { PublicContentCache } from "../../src/cms/content-cache";

describe("M3C4", () => {
  it("reuses fresh published content within the TTL", async () => {
    let now = 1_000;
    const fetcher = vi.fn(async () => ({ version: 2, title: "Home" }));
    const cache = new PublicContentCache(fetcher, {
      ttlMs: 5_000,
      staleIfErrorMs: 2_000,
      now: () => now,
    });

    await expect(cache.get()).resolves.toEqual({ version: 2, title: "Home" });
    now = 5_999;
    await expect(cache.get()).resolves.toEqual({ version: 2, title: "Home" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("serves stale content only while the stale-on-error window is open", async () => {
    let now = 1_000;
    const fetcher = vi
      .fn<() => Promise<{ version: number }>>()
      .mockResolvedValueOnce({ version: 2 })
      .mockRejectedValue(new Error("upstream unavailable"));
    const cache = new PublicContentCache(fetcher, {
      ttlMs: 100,
      staleIfErrorMs: 500,
      now: () => now,
    });

    await cache.get();
    now = 1_101;
    await expect(cache.getWithState()).resolves.toMatchObject({ value: { version: 2 }, stale: true });
    now = 1_601;
    await expect(cache.get()).rejects.toBeInstanceOf(PublicContentUnavailableError);
  });

  it("returns a 503-shaped error when no value has ever loaded", async () => {
    const cache = new PublicContentCache(
      async () => {
        throw new Error("upstream unavailable");
      },
      { ttlMs: 100, staleIfErrorMs: 100 },
    );

    await expect(cache.get()).rejects.toMatchObject({ status: 503 });
  });

  it("deduplicates concurrent refreshes", async () => {
    let release: (() => void) | undefined;
    const fetcher = vi.fn(
      () =>
        new Promise<{ version: number }>((resolve) => {
          release = () => resolve({ version: 3 });
        }),
    );
    const cache = new PublicContentCache(fetcher, { ttlMs: 100, staleIfErrorMs: 100 });
    const first = cache.get();
    const second = cache.get();
    expect(fetcher).toHaveBeenCalledTimes(1);
    release?.();
    await expect(first).resolves.toEqual({ version: 3 });
    await expect(second).resolves.toEqual({ version: 3 });
  });
});
