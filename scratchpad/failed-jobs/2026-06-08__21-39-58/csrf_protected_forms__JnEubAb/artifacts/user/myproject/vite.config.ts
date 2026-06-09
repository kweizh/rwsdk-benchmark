import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { redwood } from "rwsdk/vite";

export default defineConfig({
  plugins: [redwood(), cloudflare()],
});
