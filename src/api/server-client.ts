import { z } from "zod";

import type { components } from "./generated/site-server/schema";
import { APIRequestError } from "./errors";
import type { LocaleRegistry } from "../i18n/locale-registry";

type LocaleResponse = components["schemas"]["LocaleListResponse"];
type CatalogResponse = components["schemas"]["TranslationCatalogResponse"];

const localeResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      code: z.string().min(2),
      name: z.string().min(1),
      direction: z.enum(["ltr", "rtl"]),
      enabled: z.boolean(),
      selectable: z.boolean(),
      default: z.boolean(),
    }),
  ),
});

const catalogResponseSchema = z.object({
  locale: z.string().min(2),
  category: z.string().min(1),
  version: z.number().int().positive(),
  entries: z.record(z.string(), z.string()),
});

export class SiteServerAPIClient {
  constructor(
    private readonly baseUrl: string,
    private readonly request: typeof fetch = fetch,
    private readonly timeoutMs = 5_000,
  ) {}

  async listLocales(): Promise<LocaleRegistry> {
    const response = await this.get("/locales");
    const body: LocaleResponse = localeResponseSchema.parse(await response.json());
    return { locales: body.items };
  }

  async getCatalog(locale: string, category: string): Promise<CatalogResponse> {
    const query = new URLSearchParams({ locale, category });
    const response = await this.get(`/localization/catalog?${query.toString()}`);
    return catalogResponseSchema.parse(await response.json());
  }

  private async get(path: string): Promise<Response> {
    const response = await this.request(new URL(path.replace(/^\//, ""), `${this.baseUrl}/`), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      throw new APIRequestError("Upstream API request failed", response.status);
    }
    return response;
  }
}
