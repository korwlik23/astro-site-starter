export const openAPIClientConfig = {
  public: {
    input: ".contracts/public.openapi.yaml",
    output: "src/api/generated/public/schema.ts",
  },
  siteServer: {
    input: ".contracts/site-server.openapi.yaml",
    output: "src/api/generated/site-server/schema.ts",
  },
  metadataOutput: "src/api/contract.meta.json",
} as const;
