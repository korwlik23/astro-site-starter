import { parseSiteEnvironment } from "./env";

export function loadSiteConfig(
  values: Readonly<Record<string, string | undefined>> = process.env,
) {
  return parseSiteEnvironment(values);
}
