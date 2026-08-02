export class APIRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "APIRequestError";
  }
}

export class LocaleRegistryUnavailableError extends Error {
  readonly status = 503;

  constructor() {
    super("Locale registry is temporarily unavailable");
    this.name = "LocaleRegistryUnavailableError";
  }
}

export class PublicContentUnavailableError extends Error {
  readonly status = 503;
  override readonly cause?: unknown;

  constructor(cause?: unknown) {
    super("Public content is temporarily unavailable");
    this.name = "PublicContentUnavailableError";
    this.cause = cause;
  }
}
