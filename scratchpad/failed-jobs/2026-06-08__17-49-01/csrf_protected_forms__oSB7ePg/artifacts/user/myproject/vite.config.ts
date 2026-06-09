import { defineConfig } from "vite";
import { redwood } from "rwsdk/vite";
import { builtinModules } from "node:module";

const cloudflareBuiltInModules = [
  "cloudflare:email",
  "cloudflare:sockets",
  "cloudflare:workers",
  "cloudflare:workflows",
];

const externalModules = [
  ...cloudflareBuiltInModules,
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

export default defineConfig({
  plugins: [redwood()],
  environments: {
    worker: {
      optimizeDeps: {
        exclude: externalModules,
      },
    },
    ssr: {
      optimizeDeps: {
        exclude: externalModules,
      },
    },
  },
});
