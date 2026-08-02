import type { components } from "../api/generated/public/schema";

export type PublicBlock = components["schemas"]["PublicBlock"];
export type BlockType = PublicBlock["type"];

const blockTypes: readonly BlockType[] = ["text", "image", "callout", "answer", "steps", "comparison"];

export function isBlockType(value: unknown): value is BlockType {
  return typeof value === "string" && blockTypes.includes(value as BlockType);
}

export function selectRenderableBlocks(value: unknown): PublicBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isPublicBlock);
}

export function isPublicBlock(value: unknown): value is PublicBlock {
  if (!isRecord(value) || !isBlockType(value.type) || !isRecord(value.data)) return false;
  return true;
}

export function stringField(data: Readonly<Record<string, unknown>>, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

export function boundedText(value: string, max = 8_000): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function stringArrayField(data: Readonly<Record<string, unknown>>, key: string): string[] {
  const value = data[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => boundedText(item));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
