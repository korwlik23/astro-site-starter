import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const execute = promisify(execFile);
const outputs = [
  [".contracts/public.openapi.yaml", "src/api/generated/public/schema.ts"],
  [".contracts/site-server.openapi.yaml", "src/api/generated/site-server/schema.ts"],
];

for (const [input, output] of outputs) {
  const outputPath = resolve(output);
  await mkdir(dirname(outputPath), { recursive: true });
  await execute(
    process.execPath,
    [
      resolve("node_modules/openapi-typescript/bin/cli.js"),
      resolve(input),
      "--output",
      outputPath,
      "--alphabetize",
    ],
    { windowsHide: true },
  );
}

const lock = JSON.parse(await readFile(resolve("contracts/openapi.lock.json"), "utf8"));
await mkdir(resolve("src/api"), { recursive: true });
await writeFile(
  resolve("src/api/contract.meta.json"),
  `${JSON.stringify(lock, null, 2)}\n`,
);
