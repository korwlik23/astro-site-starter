import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("C3 site image contract", () => {
  it("uses a pinned multi-stage non-root standalone runtime", () => {
    const dockerfile = readFileSync(resolve(process.cwd(), "Dockerfile"), "utf8");

    expect(dockerfile.match(/^FROM .*@sha256:/gm)).toHaveLength(2);
    expect(dockerfile).toContain("pnpm install --frozen-lockfile");
    expect(dockerfile).toContain("USER 1000:1000");
    expect(dockerfile).toContain("EXPOSE 4321");
    expect(dockerfile).toContain('CMD ["node", "dist/server/entry.mjs"]');
    expect(dockerfile).toContain("HEALTHCHECK");
  });
});
