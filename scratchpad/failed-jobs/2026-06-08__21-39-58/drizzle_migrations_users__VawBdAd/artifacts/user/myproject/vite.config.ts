import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import rwsdk from "rwsdk/vite";

export default defineConfig({
  plugins: [cloudflare(), rwsdk()],
});
