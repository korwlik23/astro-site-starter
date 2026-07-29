import node from "@astrojs/node";
import { defineConfig } from "astro/config";

export default defineConfig({
  adapter: node({
    mode: "standalone",
  }),
  output: "server",
  security: {
    checkOrigin: true,
  },
  server: {
    host: "0.0.0.0",
    port: 4321,
  },
});
