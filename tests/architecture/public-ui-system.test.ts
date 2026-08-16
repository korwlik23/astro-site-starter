import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const legacyVisualDebt: Record<string, number> = {
  "src/styles/global.css": 0,
};
const legacyHiddenNavigationDebt = 0;
const legacyUnstyledBlocks = new Set([
  "answer-block",
  "callout-block",
  "comparison-block",
  "comparison-grid",
  "image-block",
  "steps-block",
]);

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "generated") files.push(...await sourceFiles(path));
    } else if ([".astro", ".css", ".ts"].includes(extname(entry.name))) {
      files.push(path);
    }
  }
  return files;
}

export function collectVisualViolations(source: string): string[] {
  const values: string[] = [];
  for (const pattern of [/#\b[\da-f]{3,8}\b/gi, /rgba?\(/gi, /hsla?\(/gi]) {
    for (const match of source.matchAll(pattern)) values.push(match[0]);
  }
  for (const match of source.matchAll(/\bbox-shadow\s*:\s*([^;}{]+)/gi)) {
    const value = match[1]?.trim() ?? "";
    if (value !== "none" && !value.startsWith("var(")) values.push(value);
  }
  for (const match of source.matchAll(/\bborder-radius\s*:\s*([^;}{]+)/gi)) {
    const value = match[1]?.trim() ?? "";
    if (!value.startsWith("var(")) values.push(value);
  }
  for (const match of source.matchAll(
    /(?:^|[;{]\s*)(?:color|background(?:-color)?|border(?:-[\w-]+)?-color)\s*:\s*(white|black)\b/gim,
  )) values.push(match[1] ?? "");
  return values;
}

export function hiddenGenericNavigationCount(source: string): number {
  return [...source.matchAll(/(?:^|})\s*nav\s*{[^}]*\bdisplay\s*:\s*none\b[^}]*}/gims)].length;
}

describe("public UI system boundary", () => {
  it("defines semantic light/dark tokens and ordered base layers", async () => {
    const tokens = await readFile(resolve("src/styles/tokens.css"), "utf8");
    const base = await readFile(resolve("src/styles/base.css"), "utf8");
    const global = await readFile(resolve("src/styles/global.css"), "utf8");
    for (const token of [
      "--color-canvas", "--color-surface", "--color-text", "--color-text-muted",
      "--color-border", "--color-action", "--color-focus", "--font-sans",
      "--font-display", "--space-1", "--space-8", "--radius-md", "--content-wide",
    ]) expect(tokens, token).toContain(`${token}:`);
    expect(tokens).toContain("@media (prefers-color-scheme: dark)");
    expect(base).toContain(":focus-visible");
    expect(base).toContain("[dir=\"rtl\"]");
    expect(base).toContain("@media (prefers-reduced-motion: reduce)");
    expect(global.indexOf('@import "./tokens.css";')).toBeLessThan(global.indexOf('@import "./base.css";'));
    expect(collectVisualViolations(base)).toEqual([]);
  });

  it("detects visual escape hatches and generic hidden navigation", () => {
    const invalid = `
      nav { display: none }
      .card { color: #fff; background: rgb(0 0 0); border-radius: 9px; box-shadow: 0 1px 2px #0003; }
    `;
    expect(collectVisualViolations(invalid).length).toBeGreaterThanOrEqual(5);
    expect(hiddenGenericNavigationCount(invalid)).toBe(1);
  });

  it("does not allow visual or hidden-navigation debt to grow", async () => {
    const files = await sourceFiles(resolve("src"));
    const growth: string[] = [];
    let hiddenNavigation = 0;
    for (const file of files) {
      const name = relative(process.cwd(), file).replaceAll("\\", "/");
      if (name === "src/styles/tokens.css") continue;
      const source = await readFile(file, "utf8");
      const actual = collectVisualViolations(source).length;
      const allowed = legacyVisualDebt[name] ?? 0;
      if (actual > allowed) growth.push(`${name}: ${actual} > ${allowed}`);
      hiddenNavigation += hiddenGenericNavigationCount(source);
    }
    if (hiddenNavigation > legacyHiddenNavigationDebt) {
      growth.push(`generic hidden navigation: ${hiddenNavigation} > ${legacyHiddenNavigationDebt}`);
    }
    expect(growth).toEqual([]);
  });

  it("tracks every unstyled CMS block explicitly", async () => {
    const blockFiles = (await sourceFiles(resolve("src/blocks"))).filter((file) => file.endsWith(".astro"));
    const cssFiles = (await sourceFiles(resolve("src/styles"))).filter((file) => file.endsWith(".css"));
    const css = (await Promise.all(cssFiles.map((file) => readFile(file, "utf8")))).join("\n");
    const missing: string[] = [];
    for (const file of blockFiles) {
      const source = await readFile(file, "utf8");
      for (const match of source.matchAll(/class="([\w-]+)"/g)) {
        const className = match[1] ?? "";
        if (!css.includes(`.${className}`) && !legacyUnstyledBlocks.has(className)) missing.push(className);
      }
    }
    expect(missing).toEqual([]);
  });
});
