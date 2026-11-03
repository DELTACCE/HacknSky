import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set `base` (e.g. '/hacknsky/') if the site is served from a sub-path.
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700, // three.js is large by nature; it is code-split behind the home page.
  },
});
