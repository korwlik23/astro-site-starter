import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, type Page } from "@playwright/test";

export async function visualDirectory(scope: string): Promise<string> {
  const directory = resolve(process.cwd(), "..", "tmp", "ui-review", scope);
  await mkdir(directory, { recursive: true });
  return directory;
}

export async function expectReadableBody(page: Page): Promise<void> {
  const colors = await page.locator("body").evaluate((element) => {
    const style = getComputedStyle(element);
    return { foreground: style.color, background: style.backgroundColor };
  });
  expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
}

function contrastRatio(foreground: string, background: string): number {
  const left = luminance(parseRGB(foreground));
  const right = luminance(parseRGB(background));
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

function parseRGB(value: string): [number, number, number] {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Unsupported color: ${value}`);
  return channels as [number, number, number];
}

function luminance([red, green, blue]: [number, number, number]): number {
  const channels = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}
