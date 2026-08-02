const localeCodePattern = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

export function localePath(locale: string, path = "/"): string {
  if (!localeCodePattern.test(locale)) {
    throw new Error("Invalid locale code");
  }
  const suffix = path === "/" || path === "" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  return `/${locale}${suffix}/`;
}
