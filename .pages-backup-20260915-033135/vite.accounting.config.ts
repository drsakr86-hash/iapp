import { defineConfig } from 'vite';

// Builds a single self-contained IIFE exposing the pure accounting logic,
// so it can be asserted against without a database or a DOM. Test-only;
// not part of `npm run build`.
export default defineConfig({
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: 'tests/dist-accounting',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: 'tests/accounting.entry.ts',
      formats: ['iife'],
      name: 'IAppAccountingTest',
      fileName: () => 'accounting.js',
    },
  },
});
