import type { components } from "./generated/public/schema";
import { APIRequestError } from "./errors";

type LocaleListResponse = components["schemas"]["LocaleListResponse"];

export class PublicAPIClient {
  constructor(
    private readonly baseUrl: string,
    private readonly request: typeof fetch = fetch,
  ) {}

  async listLocales(): Promise<LocaleListResponse> {
    const response = await this.request(new URL("locales", `${this.baseUrl}/`), {
      credentials: "omit",
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      throw new APIRequestError("Public API request failed", response.status);
    }
    return (await response.json()) as LocaleListResponse;
  }
}
