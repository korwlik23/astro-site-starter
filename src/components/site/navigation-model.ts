import { localePath } from "../../i18n/locale-url";

export interface NavigationCatalog {
  primary_label: string;
  features: string;
  architecture: string;
  faq: string;
}

export interface NavigationItem {
  id: "features" | "architecture" | "faq";
  label: string;
  href: string;
}

export function buildPrimaryNavigation(
  locale: string,
  catalog: NavigationCatalog,
): readonly NavigationItem[] {
  const home = localePath(locale);
  return [
    { id: "features", label: catalog.features, href: `${home}#features` },
    { id: "architecture", label: catalog.architecture, href: `${home}#architecture` },
    { id: "faq", label: catalog.faq, href: `${home}#faq` },
  ];
}

export function normalizeCurrentPath(path: string): string {
  const normalized = path.replace(/^\/+|\/+$/g, "");
  if (
    normalized.includes("..") ||
    normalized.includes("\\") ||
    normalized !== "" &&
      normalized.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) throw new Error("Invalid current path");
  return normalized;
}

export function languagePath(locale: string, currentPath: string): string {
  return localePath(locale, normalizeCurrentPath(currentPath));
}
