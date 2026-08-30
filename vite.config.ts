import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages serves this repository at /iapp/. The React application is
 * deployed to /iapp/app/ so that /iapp/ and /iapp/v2/ keep serving the legacy
 * applications untouched. `base` here and `basename` in app/App.tsx must
 * always be changed together.
 *
 * Code splitting is by route: each role section is React.lazy in
 * routes/index.tsx, so Vite emits a chunk per role and a patient on a phone
 * never downloads the doctor application. No manual vendor chunking is
 * configured — measure before optimising further (Step 14).
 */
export default defineConfig({
  base: '/iapp/app/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
