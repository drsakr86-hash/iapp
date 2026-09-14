import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Same approach as vite.smoke.config.ts: one self-contained IIFE so the real
// components run inside jsdom without a dev server. Test-only.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: 'tests/dist-medical',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: 'tests/medical.entry.tsx',
      formats: ['iife'],
      name: 'IAppMedical',
      fileName: () => 'medical.js',
    },
  },
});
