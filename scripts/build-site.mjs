#!/usr/bin/env node
// Copies the published application surface into ./_site for static hosting
// (GitHub Pages, Netlify, Vercel, any web server). There is no compile step:
// the app ships as plain HTML, CSS and JavaScript. Tooling, tests and docs are
// deliberately excluded so the deployed site contains only what the app needs.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = join(ROOT, '_site');

export const PUBLISHED = [
  'index.html',
  'community-share.html',
  'manifest.webmanifest',
  'sw.js',
  'icon-192.png',
  'icon-512.png',
  'LICENSE',
  'css',
  'js',
  'physics-intelligence',
  'study-tracker',
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const entry of PUBLISHED) {
  const from = join(ROOT, entry);
  if (!existsSync(from)) throw new Error(`Missing published file: ${entry}`);
  cpSync(from, join(OUT, entry), { recursive: true });
}
// GitHub Pages: serve files as-is (no Jekyll processing).
writeFileSync(join(OUT, '.nojekyll'), '');
console.log(`Built static site in ${OUT} (${PUBLISHED.length} entries).`);
