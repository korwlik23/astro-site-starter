import node from "@astrojs/node";
import { defineConfig, sessionDrivers } from "astro/config";

export default defineConfig({
  adapter: node({
    mode: "standalone",
  }),
  output: "server",
  session: {
    driver: sessionDrivers.lruCache({
      max: 500,
    }),
  },
  security: {
    checkOrigin: true,
  },
  server: {
    host: "0.0.0.0",
    port: 4321,
  },
});
