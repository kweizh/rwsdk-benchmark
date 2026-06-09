import { defineConfig } from "vite";
import { redwood } from "rwsdk/vite";

export default defineConfig({
  plugins: [redwood()],
  optimizeDeps: {
    esbuildOptions: {
      external: ["cloudflare:workers", "async_hooks"],
    },
  },
  environments: {
    client: {
      optimizeDeps: {
        esbuildOptions: {
          external: ["cloudflare:workers", "async_hooks"],
        },
      },
    },
    ssr: {
      optimizeDeps: {
        esbuildOptions: {
          external: ["cloudflare:workers", "async_hooks"],
        },
      },
    },
    worker: {
      optimizeDeps: {
        esbuildOptions: {
          external: ["cloudflare:workers", "async_hooks"],
        },
      },
    },
  },
});
