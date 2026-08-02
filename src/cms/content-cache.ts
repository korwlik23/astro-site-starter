import { PublicContentUnavailableError } from "../api/errors";

export interface ContentCacheOptions {
  ttlMs: number;
  staleIfErrorMs: number;
  now?: () => number;
}

export interface ContentCacheResult<T> {
  value: T;
  stale: boolean;
  loadedAt: number;
  expiresAt: number;
  staleUntil: number;
}

interface CachedContent<T> {
  value: T;
  loadedAt: number;
  expiresAt: number;
  staleUntil: number;
}

export class PublicContentCache<T> {
  private cached: CachedContent<T> | undefined;
  private refresh: Promise<CachedContent<T>> | undefined;
  private readonly now: () => number;

  constructor(
    private readonly fetchContent: () => Promise<T>,
    private readonly options: ContentCacheOptions,
  ) {
    if (!Number.isFinite(options.ttlMs) || options.ttlMs <= 0) {
      throw new Error("Public content TTL must be positive");
    }
    if (!Number.isFinite(options.staleIfErrorMs) || options.staleIfErrorMs < 0) {
      throw new Error("Public content stale window must not be negative");
    }
    this.now = options.now ?? Date.now;
  }

  async get(): Promise<T> {
    return (await this.getWithState()).value;
  }

  async getWithState(): Promise<ContentCacheResult<T>> {
    const now = this.now();
    if (this.cached && now < this.cached.expiresAt) {
      return this.toResult(this.cached, false);
    }

    try {
      this.refresh ??= this.reload();
      const loaded = await this.refresh;
      return this.toResult(loaded, false);
    } catch (error) {
      if (this.cached && now < this.cached.staleUntil) {
        return this.toResult(this.cached, true);
      }
      if (error instanceof PublicContentUnavailableError) {
        throw error;
      }
      throw new PublicContentUnavailableError(error);
    } finally {
      this.refresh = undefined;
    }
  }

  invalidate(): void {
    this.cached = undefined;
  }

  private async reload(): Promise<CachedContent<T>> {
    const value = await this.fetchContent();
    const loadedAt = this.now();
    const cached: CachedContent<T> = {
      value,
      loadedAt,
      expiresAt: loadedAt + this.options.ttlMs,
      staleUntil: loadedAt + this.options.ttlMs + this.options.staleIfErrorMs,
    };
    this.cached = cached;
    return cached;
  }

  private toResult(cached: CachedContent<T>, stale: boolean): ContentCacheResult<T> {
    return {
      value: cached.value,
      stale,
      loadedAt: cached.loadedAt,
      expiresAt: cached.expiresAt,
      staleUntil: cached.staleUntil,
    };
  }
}
