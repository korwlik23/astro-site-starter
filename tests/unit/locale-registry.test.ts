import { describe, expect, it, vi } from "vitest";

import { LocaleRegistryUnavailableError } from "../../src/api/errors";
import { LocaleRegistryCache } from "../../src/cms/cache/locale-cache";
import type { LocaleRegistry } from "../../src/i18n/locale-registry";

const registry: LocaleRegistry = {
  locales: [
    { code: "en", name: "English", direction: "ltr", enabled: true, selectable: true, default: true },
  ],
};

describe("S3A", () => {
  it("reuses a fresh registry for the bounded TTL", async () => {
    let now = 1_000;
    const fetcher = vi.fn(async () => registry);
    const cache = new LocaleRegistryCache(fetcher, { ttlMs: 5_000, now: () => now });

    await expect(cache.get()).resolves.toBe(registry);
    now = 5_999;
    await expect(cache.get()).resolves.toBe(registry);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("serves stale registry data when a refresh fails", async () => {
    let now = 1_000;
    const fetcher = vi
      .fn<() => Promise<LocaleRegistry>>()
      .mockResolvedValueOnce(registry)
      .mockRejectedValueOnce(new Error("network unavailable"));
    const cache = new LocaleRegistryCache(fetcher, { ttlMs: 100, now: () => now });

    await cache.get();
    now = 1_101;
    await expect(cache.get()).resolves.toBe(registry);
  });

  it("returns a service-unavailable error when no registry has ever loaded", async () => {
    const cache = new LocaleRegistryCache(
      async () => {
        throw new Error("network unavailable");
      },
      { ttlMs: 100 },
    );

    await expect(cache.get()).rejects.toBeInstanceOf(LocaleRegistryUnavailableError);
  });
});
