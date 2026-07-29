import type { LocaleRegistry } from "./locale-registry";
import { localePath } from "./locale-url";
import { selectLocale } from "./select-locale";

export function createRootRedirect(
  registry: LocaleRegistry,
  headers: Headers,
): Response {
  const locale = selectLocale(
    registry,
    headers.get("cookie") ?? undefined,
    headers.get("accept-language") ?? undefined,
  );
  return new Response(null, {
    status: 302,
    headers: {
      "cache-control": "private, no-store",
      location: localePath(locale),
      vary: "Cookie, Accept-Language",
    },
  });
}
