import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { fetchContracts } from "../../scripts/contracts/fetch-openapi.mjs";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("immutable Site OpenAPI acquisition", () => {
  it("copies both checksum-verified artifacts from the locked API commit", async () => {
    const outputRoot = await temporaryDirectory();

    await fetchContracts({
      lockPath: resolve("contracts/openapi.lock.json"),
      localRoot: resolve("../api"),
      outputRoot,
    });

    await expect(readFile(join(outputRoot, "public.openapi.yaml"), "utf8")).resolves.toBe(
      await readFile(resolve("../api/openapi/dist/public.openapi.yaml"), "utf8"),
    );
    await expect(
      readFile(join(outputRoot, "site-server.openapi.yaml"), "utf8"),
    ).resolves.toBe(
      await readFile(resolve("../api/openapi/dist/site-server.openapi.yaml"), "utf8"),
    );
  });

  it("rejects a checksum mismatch before publishing either artifact", async () => {
    const directory = await temporaryDirectory();
    const lock = JSON.parse(
      await readFile(resolve("contracts/openapi.lock.json"), "utf8"),
    ) as {
      artifacts: { public: { sha256: string } };
    };
    lock.artifacts.public.sha256 = "0".repeat(64);
    const lockPath = join(directory, "invalid.json");
    await writeFile(lockPath, JSON.stringify(lock));

    await expect(
      fetchContracts({
        lockPath,
        localRoot: resolve("../api"),
        outputRoot: join(directory, "output"),
      }),
    ).rejects.toThrow("checksum");
  });

  it("rejects mutable commits and paths that escape the checkout", async () => {
    const directory = await temporaryDirectory();
    const source = JSON.parse(
      await readFile(resolve("contracts/openapi.lock.json"), "utf8"),
    ) as {
      commit: string;
      artifacts: { public: { artifactPath: string } };
    };

    source.commit = "main";
    const mutablePath = join(directory, "mutable.json");
    await writeFile(mutablePath, JSON.stringify(source));
    await expect(
      fetchContracts({
        lockPath: mutablePath,
        localRoot: resolve("../api"),
        outputRoot: join(directory, "mutable-output"),
      }),
    ).rejects.toThrow("invalid or mutable");

    source.commit = "71a668a7a48ff145c4b776718db8e74aea327aa2";
    source.artifacts.public.artifactPath = "../secret";
    const traversalPath = join(directory, "traversal.json");
    await writeFile(traversalPath, JSON.stringify(source));
    await expect(
      fetchContracts({
        lockPath: traversalPath,
        localRoot: resolve("../api"),
        outputRoot: join(directory, "traversal-output"),
      }),
    ).rejects.toThrow("artifact path");
  });
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "site-contract-"));
  temporaryDirectories.push(directory);
  return directory;
}
