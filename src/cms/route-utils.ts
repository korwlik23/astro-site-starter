import { APIRequestError } from "../api/errors";

export function normalizePublicPath(value: string | undefined): string {
  const raw = (value ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (raw === "") return "";
  const segments = raw.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === ".." || segment.includes("\\"))) {
    throw new APIRequestError("Public content was not found", 404);
  }
  if (raw.length > 512) throw new APIRequestError("Public content was not found", 404);
  return segments.join("/");
}

export function applyPublicCacheHeaders(response: { headers: Headers }, etag: string | undefined, stale: boolean): void {
  response.headers.set("cache-control", stale ? "public, max-age=0, stale-while-revalidate=120" : "public, max-age=60, stale-while-revalidate=120");
  if (etag !== undefined) response.headers.set("etag", etag);
}

export function requestMatchesETag(request: Request, etag: string | undefined): boolean {
  return etag !== undefined && request.headers.get("if-none-match") === etag;
}
