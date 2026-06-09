import { defineConfig } from "vite";
import { redwood } from "rwsdk/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "worker" },
    }),
    redwood(),
  ],
  server: {
    // Pass OPTIONS requests through to the worker instead of intercepting them
    // for CORS preflight. This lets route handlers define their own Allow headers.
    cors: { preflightContinue: true },
  },
});
