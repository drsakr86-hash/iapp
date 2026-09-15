import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds a single self-contained IIFE so the real application can run inside
// jsdom without a dev server. Test-only; not part of `npm run build`.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: 'tests/dist',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: 'tests/smoke.entry.tsx',
      formats: ['iife'],
      name: 'IAppSmoke',
      fileName: () => 'smoke.js',
    },
  },
});
