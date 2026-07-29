import { readFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const importPattern =
  /(?:import|export)\s+(?:[^"'()]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
const extensions = [".ts", ".tsx", ".js", ".mjs"];
const forbiddenPathFragments = [
  "/api/server-client",
  "/api/generated/site-server/",
  "/cms/cache/",
  "/runtime/",
];

export async function checkClientBoundaries(options) {
  const root = resolve(options.root);
  const queue = options.entrypoints.map((entrypoint) => resolve(entrypoint));
  const visited = new Set();
  const violations = [];

  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || visited.has(file)) continue;
    visited.add(file);
    const source = await readFile(file, "utf8");

    for (const specifier of imports(source)) {
      if (specifier.startsWith("node:")) {
        violations.push(`${display(root, file)} imports server runtime ${specifier}`);
        continue;
      }
      if (!specifier.startsWith(".") && !isAbsolute(specifier)) continue;
      const dependency = await resolveLocalImport(file, specifier);
      const normalized = dependency.replaceAll("\\", "/");
      if (forbiddenPathFragments.some((fragment) => normalized.includes(fragment))) {
        violations.push(`${display(root, file)} imports server-only module ${specifier}`);
        continue;
      }
      queue.push(dependency);
    }
  }

  return violations;
}

function imports(source) {
  const specifiers = [];
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2];
    if (specifier) specifiers.push(specifier);
  }
  return specifiers;
}

async function resolveLocalImport(importer, specifier) {
  const candidate = resolve(dirname(importer), specifier);
  if (extname(candidate)) return candidate;
  for (const extension of extensions) {
    try {
      await readFile(`${candidate}${extension}`);
      return `${candidate}${extension}`;
    } catch {
      // Continue through the bounded extension allowlist.
    }
  }
  throw new Error(`Cannot resolve local import ${specifier} from ${importer}`);
}

function display(root, file) {
  return relative(root, file).replaceAll("\\", "/");
}

async function runCLI() {
  const violations = await checkClientBoundaries({
    root: resolve("."),
    entrypoints: [resolve("src/api/client.ts")],
  });
  if (violations.length > 0) {
    throw new Error(violations.join("\n"));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runCLI();
}
