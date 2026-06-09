import { defineConfig } from "vite";
import { redwood } from "rwsdk/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    cloudflare(),
    redwood({
      esbuildOptions: {
        external: ["cloudflare:workers", "async_hooks"],
      },
    }),
  ],
});
