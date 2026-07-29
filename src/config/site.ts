import { parseSiteEnvironment } from "./env";

export function loadSiteConfig(
  values: Readonly<Record<string, string | undefined>> = import.meta.env,
) {
  return parseSiteEnvironment(values);
}
