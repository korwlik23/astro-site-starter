import type { BlockType, PublicBlock } from "./types";
import { isBlockType, selectRenderableBlocks } from "./types";

export const blockRegistry: Readonly<Record<BlockType, BlockType>> = {
  text: "text",
  image: "image",
  callout: "callout",
  answer: "answer",
  steps: "steps",
  comparison: "comparison",
};

export function resolveBlockRenderer(value: unknown): BlockType | undefined {
  return isBlockType(value) && blockRegistry[value] !== undefined ? blockRegistry[value] : undefined;
}

export function visibleBlocks(value: unknown): PublicBlock[] {
  return selectRenderableBlocks(value).filter((block) => resolveBlockRenderer(block.type) !== undefined);
}
