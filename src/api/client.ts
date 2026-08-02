import { z } from "zod";

import type { components } from "./generated/public/schema";
import { APIRequestError } from "./errors";

type LocaleListResponse = components["schemas"]["LocaleListResponse"];
type PublicContent = components["schemas"]["PublicContent"];
type PublicMenu = components["schemas"]["PublicMenu"];
type PublicPostListResponse = components["schemas"]["PublicPostListResponse"];
type PreviewExchangeResponse = components["schemas"]["PreviewExchangeResponse"];

export interface PublicResponse<T> {
  status: number;
  value?: T;
  etag?: string;
  cacheControl?: string;
}

export interface PublicRequestOptions {
  etag?: string;
}

export function parsePublicContent(value: unknown): PublicContent | undefined {
  const parsed = publicContentSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

const localeListSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1),
    code: z.string().min(2),
    name: z.string().min(1),
    direction: z.enum(["ltr", "rtl"]),
    enabled: z.boolean(),
    selectable: z.boolean(),
    default: z.boolean(),
  })),
}) as unknown as z.ZodType<LocaleListResponse>;

const publicBlockSchema = z.object({
  type: z.enum(["text", "image", "callout", "answer", "steps", "comparison"]),
  data: z.record(z.string(), z.unknown()),
});

const publicContentSchema = z.object({
  aeo: z.object({ answer: z.string().optional(), question: z.string().optional() }),
  alternates: z.array(z.object({
    locale_id: z.string().min(1),
    path: z.string(),
    slug: z.string(),
    title: z.string(),
    translation_id: z.string().min(1),
  })),
  blocks: z.array(publicBlockSchema),
  content_id: z.string().min(1),
  content_key: z.string().min(1),
  content_status: z.literal("published"),
  content_version: z.number().int().positive(),
  excerpt: z.string(),
  geo: z.object({ locality: z.string().optional(), region: z.string().optional() }),
  kind: z.enum(["page", "post"]),
  locale_id: z.string().min(1),
  path: z.string(),
  published_at: z.string().optional(),
  seo: z.object({
    canonical_url: z.string().optional(),
    description: z.string(),
    robots: z.string().optional(),
    structured_data: z.record(z.string(), z.unknown()).optional(),
    title: z.string(),
  }),
  slug: z.string(),
  title: z.string(),
  translation_id: z.string().min(1),
  translation_status: z.literal("published"),
  translation_version: z.number().int().positive(),
  updated_at: z.string(),
}) as unknown as z.ZodType<PublicContent>;

const publicMenuItemSchema = z.object({
  children: z.array(z.lazy(() => publicMenuItemSchema)).optional(),
  id: z.string().min(1),
  label: z.string(),
  parent_id: z.string().optional(),
  position: z.number().int().nonnegative(),
  target: z.string(),
  target_kind: z.enum(["internal_path", "external_url", "content_key"]),
}) as unknown as z.ZodType<components["schemas"]["PublicMenuItem"]>;

const publicMenuSchema = z.object({
  id: z.string().min(1),
  items: z.array(z.lazy(() => publicMenuItemSchema)),
  key: z.string().min(1),
  locale_id: z.string().min(1),
  name: z.string(),
  version: z.number().int().positive(),
}) as unknown as z.ZodType<PublicMenu>;

const publicPostListSchema = z.object({
  items: z.array(z.object({
    content_id: z.string().min(1),
    locale_id: z.string().min(1),
    path: z.string(),
    slug: z.string(),
    title: z.string(),
    translation_id: z.string().min(1),
    updated_at: z.string(),
  })),
  next: z.object({ id: z.string().min(1), updated_at: z.string() }).optional(),
}) as unknown as z.ZodType<PublicPostListResponse>;

const previewExchangeSchema = z.object({
  content_id: z.string().min(1),
  expires_at: z.string(),
  revision_id: z.string().min(1),
  snapshot: z.record(z.string(), z.unknown()),
  source_version: z.number().int().positive(),
  translation_id: z.string().min(1),
}) as unknown as z.ZodType<PreviewExchangeResponse>;

export class PublicAPIClient {
  constructor(
    private readonly baseUrl: string,
    private readonly request: typeof fetch = fetch,
    private readonly timeoutMs = 5_000,
  ) {}

  async listLocales(): Promise<LocaleListResponse> {
    const response = await this.getJSON("/locales", localeListSchema);
    return requireValue(response);
  }

  async getContent(locale: string, path: string, options: PublicRequestOptions = {}): Promise<PublicResponse<PublicContent>> {
    return this.getJSON(publicContentPath(locale, path), publicContentSchema, options);
  }

  async getMenu(locale: string, location: string, options: PublicRequestOptions = {}): Promise<PublicResponse<PublicMenu>> {
    return this.getJSON(`/public/menus/${encodeURIComponent(locale)}/${encodeURIComponent(location)}`, publicMenuSchema, options);
  }

  async listPosts(locale: string, limit = 20, options: PublicRequestOptions = {}): Promise<PublicResponse<PublicPostListResponse>> {
    const boundedLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    return this.getJSON(`/public/posts/${encodeURIComponent(locale)}?limit=${boundedLimit}`, publicPostListSchema, options);
  }

  async getPost(locale: string, slug: string, options: PublicRequestOptions = {}): Promise<PublicResponse<PublicContent>> {
    return this.getJSON(`/public/posts/${encodeURIComponent(locale)}/${encodeURIComponent(slug)}`, publicContentSchema, options);
  }

  async exchangePreview(token: string): Promise<PreviewExchangeResponse> {
    if (token.trim() === "") throw new APIRequestError("Preview code is not available", 404);
    const response = await this.requestJSON<PreviewExchangeResponse>("/public/previews/exchange", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    }, previewExchangeSchema);
    return requireValue(response);
  }

  private async getJSON<T>(path: string, schema: z.ZodType<T>, options: PublicRequestOptions = {}): Promise<PublicResponse<T>> {
    const headers = new Headers({ accept: "application/json" });
    if (options.etag !== undefined) headers.set("if-none-match", options.etag);
    return this.requestJSON(path, { method: "GET", headers, credentials: "omit" }, schema);
  }

  private async requestJSON<T>(path: string, init: RequestInit, schema: z.ZodType<T>): Promise<PublicResponse<T>> {
    let response: Response;
    try {
      const signal = AbortSignal.timeout(this.timeoutMs);
      response = await this.request(new URL(path.replace(/^\//, ""), `${this.baseUrl}/`), { ...init, signal });
    } catch {
      throw new APIRequestError("Public API is temporarily unavailable", 503);
    }
    const etag = response.headers.get("etag") ?? undefined;
    const cacheControl = response.headers.get("cache-control") ?? undefined;
    if (response.status === 304) {
      return { status: 304, ...(etag === undefined ? {} : { etag }), ...(cacheControl === undefined ? {} : { cacheControl }) };
    }
    if (!response.ok) throw new APIRequestError("Public API request failed", response.status);
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new APIRequestError("Public API returned an invalid response", 502);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new APIRequestError("Public API returned an invalid response", 502);
    return { status: response.status, value: parsed.data, ...(etag === undefined ? {} : { etag }), ...(cacheControl === undefined ? {} : { cacheControl }) };
  }
}

function publicContentPath(locale: string, path: string): string {
  const normalized = path.trim().replace(/^\/+|\/+$/g, "");
  const suffix = normalized === "" ? "" : `/${normalized.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
  return `/public/content/${encodeURIComponent(locale)}${suffix}`;
}

function requireValue<T>(response: PublicResponse<T>): T {
  if (response.value === undefined) throw new APIRequestError("Public API returned an empty response", 502);
  return response.value;
}
