import { LocaleRegistryUnavailableError } from "../../api/errors";
import type { LocaleRegistry } from "../../i18n/locale-registry";

export interface LocaleCacheOptions {
  ttlMs: number;
  now?: () => number;
}

export class LocaleRegistryCache {
  private cached?: { registry: LocaleRegistry; expiresAt: number };
  private refresh: Promise<LocaleRegistry> | undefined;
  private readonly now: () => number;

  constructor(
    private readonly fetchRegistry: () => Promise<LocaleRegistry>,
    private readonly options: LocaleCacheOptions,
  ) {
    if (!Number.isFinite(options.ttlMs) || options.ttlMs <= 0) {
      throw new Error("Locale registry TTL must be positive");
    }
    this.now = options.now ?? Date.now;
  }

  async get(): Promise<LocaleRegistry> {
    if (this.cached && this.now() < this.cached.expiresAt) {
      return this.cached.registry;
    }

    try {
      this.refresh ??= this.reload();
      return await this.refresh;
    } catch {
      if (this.cached) return this.cached.registry;
      throw new LocaleRegistryUnavailableError();
    } finally {
      this.refresh = undefined;
    }
  }

  private async reload(): Promise<LocaleRegistry> {
    const registry = await this.fetchRegistry();
    this.cached = {
      registry,
      expiresAt: this.now() + this.options.ttlMs,
    };
    return registry;
  }
}
