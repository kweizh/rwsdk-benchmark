import { defineConfig } from "vite";
import { redwood } from "rwsdk/vite";

export default defineConfig(async () => ({
  plugins: [await redwood()],
  environments: {
    worker: {
      optimizeDeps: {
        exclude: [
          "cloudflare:workers",
          "async_hooks",
          "node:async_hooks",
        ],
        esbuildOptions: {
          external: [
            "cloudflare:workers",
            "async_hooks",
            "node:async_hooks",
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
}));
