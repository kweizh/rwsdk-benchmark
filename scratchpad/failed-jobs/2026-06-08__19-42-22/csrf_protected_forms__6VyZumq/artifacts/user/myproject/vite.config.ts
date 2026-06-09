import { defineConfig } from 'vite';
import { redwood } from 'rwsdk/vite';

export default defineConfig({
  plugins: [redwood()],
  environments: {
    worker: {
      optimizeDeps: {
        exclude: ['rwsdk', 'cloudflare:workers', 'async_hooks']
      }
    }
  }
});
