// Builds dist/: ONLY the public site files, plus dist/_headers.
// Fails if an unexpected file would be shipped (an allow-list, not a deny-list).
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const PUBLIC_EXT = new Set(['.html', '.css', '.js', '.png', '.txt', '.xml']);
const EXTRA_OK = new Set(['favicon.ico', 'manifest.webmanifest']);
const NOT_SHIPPED = new Set(['package.json', 'package-lock.json', 'wrangler.jsonc', 'ADMIN.md']);

const files = readdirSync(root).filter((f) => statSync(join(root, f)).isFile());
const ship = [];
const unexpected = [];
for (const f of files) {
  const ext = f.includes('.') ? f.slice(f.lastIndexOf('.')).toLowerCase() : '';
  if (f.startsWith('.') || NOT_SHIPPED.has(f)) continue;
  if (PUBLIC_EXT.has(ext) || EXTRA_OK.has(f)) ship.push(f);
  else unexpected.push(f);
}
if (unexpected.length) {
  console.error(`build:cf failed - unexpected top-level files (add to allow-list or move): ${unexpected.join(', ')}`);
  process.exit(1);
}
for (const required of ['index.html', '404.html', 'styles.css', 'site.js', 'robots.txt', 'sitemap.xml']) {
  if (!ship.includes(required)) {
    console.error(`build:cf failed - missing ${required}`);
    process.exit(1);
  }
}

const HEADERS = `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
`;

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const f of ship) cpSync(join(root, f), join(dist, f));
writeFileSync(join(dist, '_headers'), HEADERS);

const out = readdirSync(dist);
if (out.some((f) => !ship.includes(f) && f !== '_headers') || !existsSync(join(dist, '_headers'))) {
  console.error('build:cf failed - dist contents mismatch');
  process.exit(1);
}
console.log(`build:cf OK - ${ship.length} files + _headers -> dist/`);
