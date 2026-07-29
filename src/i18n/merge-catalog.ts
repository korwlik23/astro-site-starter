import { validateCatalog, type CatalogEntries } from "./catalog-schema";

export function mergeCatalog(
  fallback: unknown,
  target: unknown,
  override: unknown,
): CatalogEntries {
  return Object.assign(
    Object.create(null) as CatalogEntries,
    validateCatalog(fallback),
    validateCatalog(target),
    validateCatalog(override),
  );
}
