import type { PublicAPIClient } from "../api/client";
import { APIRequestError, PublicContentUnavailableError } from "../api/errors";
import type { components } from "../api/generated/public/schema";

type PublicContent = components["schemas"]["PublicContent"];

export interface ContentLoaderOptions {
  ttlMs: number;
  staleIfErrorMs: number;
  siteKey: string;
  now?: () => number;
}

export interface LoadedPublicContent {
  content: PublicContent;
  stale: boolean;
  cacheKey: string;
  etag?: string;
  loadedAt: number;
  expiresAt: number;
}

interface CachedContent extends LoadedPublicContent {
  staleUntil: number;
}

export class PublicContentLoader {
  private readonly entries = new Map<string, CachedContent>();
  private readonly refreshes = new Map<string, Promise<CachedContent>>();
  private readonly now: () => number;

  constructor(
    private readonly client: PublicAPIClient,
    private readonly options: ContentLoaderOptions,
  ) {
    if (!Number.isFinite(options.ttlMs) || options.ttlMs <= 0) throw new Error("Public content TTL must be positive");
    if (!Number.isFinite(options.staleIfErrorMs) || options.staleIfErrorMs < 0) throw new Error("Public content stale window must not be negative");
    if (options.siteKey.trim() === "") throw new Error("Public content site key is required");
    this.now = options.now ?? Date.now;
  }

  async get(locale: string, path: string): Promise<LoadedPublicContent> {
    const key = this.baseKey(locale, path);
    const current = this.entries.get(key);
    const now = this.now();
    if (current && now < current.expiresAt) return this.withState(current, false);

    try {
      const refresh = this.refreshes.get(key) ?? this.reload(key, locale, path, current);
      this.refreshes.set(key, refresh);
      return this.withState(await refresh, false);
    } catch (error) {
      if (current && now < current.staleUntil) return this.withState(current, true);
      if (error instanceof APIRequestError && error.status === 404) throw error;
      if (error instanceof PublicContentUnavailableError) throw error;
      throw new PublicContentUnavailableError(error);
    } finally {
      this.refreshes.delete(key);
    }
  }

  invalidate(locale?: string, path?: string): void {
    if (locale === undefined || path === undefined) {
      this.entries.clear();
      return;
    }
    this.entries.delete(this.baseKey(locale, path));
  }

  private async reload(key: string, locale: string, path: string, current: CachedContent | undefined): Promise<CachedContent> {
    const response = await this.client.getContent(locale, path, current?.etag === undefined ? {} : { etag: current.etag });
    const now = this.now();
    if (response.status === 304 && current !== undefined) {
      const refreshed: CachedContent = {
        ...current,
        loadedAt: now,
        expiresAt: now + this.options.ttlMs,
        staleUntil: now + this.options.ttlMs + this.options.staleIfErrorMs,
        ...(response.etag === undefined ? {} : { etag: response.etag }),
      };
      this.entries.set(key, refreshed);
      return refreshed;
    }
    if (response.value === undefined) throw new PublicContentUnavailableError();
    const loaded: CachedContent = {
      content: response.value,
      stale: false,
      cacheKey: `${this.options.siteKey}|${locale}|${path}|v${response.value.content_version}`,
      loadedAt: now,
      expiresAt: now + this.options.ttlMs,
      staleUntil: now + this.options.ttlMs + this.options.staleIfErrorMs,
      ...(response.etag === undefined ? {} : { etag: response.etag }),
    };
    this.entries.set(key, loaded);
    return loaded;
  }

  private baseKey(locale: string, path: string): string {
    return `${this.options.siteKey}|${locale.trim().toLowerCase()}|${path.trim().replace(/^\/+|\/+$/g, "")}`;
  }

  private withState(value: CachedContent, stale: boolean): LoadedPublicContent {
    return { ...value, stale };
  }
}
