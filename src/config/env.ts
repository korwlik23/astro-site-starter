import { z } from "zod";

const publicSecretPattern = /(SECRET|TOKEN|PASSWORD|PRIVATE|CREDENTIAL|KEY)/i;
const environmentSchema = z.object({
  SITE_API_BASE_URL: z.url(),
  PUBLIC_SITE_URL: z.url(),
});

export interface SiteEnvironment {
  server: {
    apiBaseUrl: string;
  };
  public: {
    siteUrl: string;
  };
}

export function parseSiteEnvironment(
  values: Readonly<Record<string, string | undefined>>,
): SiteEnvironment {
  for (const key of Object.keys(values)) {
    if (key.startsWith("PUBLIC_") && publicSecretPattern.test(key)) {
      throw new Error(`${key} is not allowed in the public namespace`);
    }
  }

  const parsed = environmentSchema.parse(values);
  return {
    server: { apiBaseUrl: normalizeUrl(parsed.SITE_API_BASE_URL) },
    public: { siteUrl: normalizeUrl(parsed.PUBLIC_SITE_URL) },
  };
}

function normalizeUrl(value: string): string {
  const url = new URL(value);
  if (url.username || url.password) {
    throw new Error("Configured URLs must not contain credentials");
  }
  return url.href.replace(/\/$/, "");
}
