import { z } from "zod";

import type { components } from "../api/generated/public/schema";

export type PublicBlock = components["schemas"]["PublicBlock"];

export interface PreviewDocument {
  title: string;
  excerpt: string;
  kind: "page" | "post";
  path: string;
  blocks: PublicBlock[];
  aeo: { question?: string; answer?: string };
  geo: { locality?: string; region?: string };
  seo: { title: string; description: string; canonical_url?: string };
}

const blockSchema = z.object({
  type: z.enum(["text", "image", "callout", "answer", "steps", "comparison"]),
  data: z.record(z.string(), z.unknown()),
});

const previewSchema = z.object({
  title: z.string().min(1).max(500),
  excerpt: z.string().max(8_000).default(""),
  kind: z.enum(["page", "post"]).default("page"),
  path: z.string().max(512).default("preview"),
  blocks: z.array(blockSchema).max(200),
  aeo: z.object({ question: z.string().optional(), answer: z.string().optional() }).default({}),
  geo: z.object({ locality: z.string().optional(), region: z.string().optional() }).default({}),
  seo: z.object({ title: z.string().default(""), description: z.string().default(""), canonical_url: z.string().optional() }).default({ title: "", description: "" }),
});

export function parsePreviewSnapshot(snapshot: Readonly<Record<string, unknown>>): PreviewDocument | undefined {
  const candidate = isRecord(snapshot.content) ? snapshot.content : snapshot;
  const parsed = previewSchema.safeParse(candidate);
  if (!parsed.success) return undefined;
  return parsed.data as PreviewDocument;
}

export function previewHeaders(): Headers {
  return new Headers({ "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
