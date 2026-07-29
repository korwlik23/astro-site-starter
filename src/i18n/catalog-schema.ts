import { z } from "zod";

export const catalogCategories = ["common", "navigation", "marketing", "forms"] as const;
export type CatalogCategory = (typeof catalogCategories)[number];
export type CatalogEntries = Record<string, string>;

const catalogKeyPattern = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const forbiddenKeys = new Set(["__proto__", "prototype", "constructor"]);

export function validateCatalog(entries: unknown): CatalogEntries {
  const result = z.record(z.string(), z.string().min(1)).safeParse(entries);
  if (!result.success) {
    throw new Error("Invalid translation catalog");
  }
  const parsed = result.data;
  for (const key of Object.keys(parsed)) {
    if (forbiddenKeys.has(key) || !catalogKeyPattern.test(key)) {
      throw new Error("Invalid translation catalog key");
    }
  }
  return parsed;
}

export function requireCatalogEntry(entries: CatalogEntries, key: string): string {
  const value = entries[key];
  if (!value) {
    throw new Error(`Required translation is missing: ${key}`);
  }
  return value;
}
