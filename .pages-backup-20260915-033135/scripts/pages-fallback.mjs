/**
 * GitHub Pages has no SPA rewrite rule. Copying index.html to 404.html makes
 * Pages serve the application for any deep link (/iapp/app/doctor) while
 * preserving the path, so React Router can resolve it on load.
 */
import { copyFileSync, existsSync } from 'node:fs';

const from = 'dist/index.html';
const to = 'dist/404.html';
if (!existsSync(from)) {
  console.error('pages-fallback: dist/index.html not found');
  process.exit(1);
}
copyFileSync(from, to);
console.log('pages-fallback: dist/404.html written');
