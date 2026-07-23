// Post-build step: copy public/images -> public/build/images.
//
// Why: on Hostinger the cron deploy's tail (which synced /images to the web
// root) dies mid-script on some cycles, but the deploy's pre-gate "build
// self-heal" reliably re-copies public/build to the web root on EVERY cron
// run. Shipping the photos inside build/ therefore guarantees delivery —
// the frontend references them as /build/images/{courses,teachers}/...
// `vite build` empties public/build first, so this runs after it (npm build).
import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'public', 'images');
const dest = join(root, 'public', 'build', 'images');

if (!existsSync(src)) {
  console.error(`copy-images-to-build: source missing: ${src}`);
  process.exit(1);
}
cpSync(src, dest, { recursive: true });
console.log(`copy-images-to-build: copied public/images -> public/build/images`);
