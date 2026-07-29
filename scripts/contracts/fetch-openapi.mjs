import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const commitPattern = /^[0-9a-f]{40}$/;
const checksumPattern = /^[0-9a-f]{64}$/;
const repositoryPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\.git$/;
const artifactNames = {
  public: "public.openapi.yaml",
  siteServer: "site-server.openapi.yaml",
};

export async function fetchContracts(options) {
  const lock = await readLock(options.lockPath);
  let temporaryRoot;
  let sourceRoot = options.localRoot;

  try {
    if (sourceRoot) {
      await verifyCheckout(sourceRoot, lock);
    } else {
      temporaryRoot = await mkdtemp(resolve(tmpdir(), "site-openapi-"));
      sourceRoot = temporaryRoot;
      await checkoutLockedCommit(sourceRoot, lock);
    }

    const verified = await Promise.all(
      Object.entries(artifactNames).map(async ([key, filename]) => {
        const artifact = lock.artifacts[key];
        const contents = await readFile(resolveArtifact(sourceRoot, artifact.artifactPath));
        const checksum = createHash("sha256").update(contents).digest("hex");
        if (checksum !== artifact.sha256) {
          throw new Error(`${key} OpenAPI checksum does not match the immutable lock`);
        }
        return { contents, filename };
      }),
    );

    await mkdir(options.outputRoot, { recursive: true });
    await Promise.all(
      verified.map(({ contents, filename }) =>
        writeFile(resolve(options.outputRoot, filename), contents),
      ),
    );
  } finally {
    if (temporaryRoot) {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  }
}

async function readLock(lockPath) {
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  if (
    !repositoryPattern.test(lock.repository) ||
    !commitPattern.test(lock.commit) ||
    typeof lock.artifacts !== "object" ||
    lock.artifacts === null
  ) {
    throw new Error("OpenAPI lock is invalid or mutable");
  }
  for (const key of Object.keys(artifactNames)) {
    const artifact = lock.artifacts[key];
    if (
      typeof artifact !== "object" ||
      artifact === null ||
      typeof artifact.artifactPath !== "string" ||
      !checksumPattern.test(artifact.sha256)
    ) {
      throw new Error("OpenAPI lock is invalid or mutable");
    }
    validateArtifactPath(artifact.artifactPath);
  }
  return lock;
}

function validateArtifactPath(artifactPath) {
  if (
    artifactPath === "" ||
    isAbsolute(artifactPath) ||
    artifactPath.includes("\\") ||
    artifactPath.split("/").some((segment) => segment === ".." || segment === "")
  ) {
    throw new Error("OpenAPI artifact path must stay within the locked repository");
  }
}

function resolveArtifact(root, artifactPath) {
  const absoluteRoot = resolve(root);
  const artifact = resolve(absoluteRoot, artifactPath);
  const fromRoot = relative(absoluteRoot, artifact);
  if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    throw new Error("OpenAPI artifact path escaped the locked repository");
  }
  return artifact;
}

async function verifyCheckout(root, lock) {
  const [{ stdout: commit }, { stdout: repository }] = await Promise.all([
    execute("git", ["-C", root, "rev-parse", "HEAD"]),
    execute("git", ["-C", root, "remote", "get-url", "origin"]),
  ]);
  if (commit.trim() !== lock.commit || repository.trim() !== lock.repository) {
    throw new Error("Local API checkout does not match the immutable lock");
  }
}

async function checkoutLockedCommit(root, lock) {
  await execute("git", ["init", "--quiet", root]);
  await execute("git", ["-C", root, "remote", "add", "origin", lock.repository]);
  await execute("git", ["-C", root, "fetch", "--quiet", "--depth", "1", "origin", lock.commit]);
  await execute("git", ["-C", root, "checkout", "--quiet", "--detach", "FETCH_HEAD"]);
}

async function runCLI() {
  const localFlagIndex = process.argv.indexOf("--local");
  const localRoot = localFlagIndex >= 0 ? process.argv.at(localFlagIndex + 1) : undefined;
  if (localFlagIndex >= 0 && !localRoot) {
    throw new Error("--local requires the API checkout path");
  }
  await fetchContracts({
    lockPath: resolve("contracts/openapi.lock.json"),
    localRoot: localRoot ? resolve(localRoot) : undefined,
    outputRoot: resolve(".contracts"),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runCLI();
}
