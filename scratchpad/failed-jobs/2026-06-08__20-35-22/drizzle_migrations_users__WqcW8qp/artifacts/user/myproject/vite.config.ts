import { defineConfig } from 'vite';
import { redwood } from 'rwsdk/vite';

export default defineConfig({
  plugins: [
    await redwood({
      entry: {
        worker: './src/worker.ts',
      },
    }),
  ],
  optimizeDeps: {
    exclude: [
      'cloudflare:workers',
      'cloudflare:node',
      'cloudflare:sockets',
      'cloudflare:workflows',
    ],
  },
});