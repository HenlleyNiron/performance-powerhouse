#!/usr/bin/env node
// Zero-dependency static file server for local development and end-to-end tests.
// Usage: node scripts/serve.mjs [port]   (default 4173)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

// Only the published application surface is served; tooling folders are not.
const BLOCKED = ['node_modules', '.git', 'tests', 'scripts', 'test-results', 'playwright-report'];

async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const safe = normalize(decoded).replace(/^([/\\])+/, '');
  if (BLOCKED.some(dir => safe === dir || safe.startsWith(dir + sep) || safe.startsWith(dir + '/'))) return null;
  let file = join(ROOT, safe);
  if (!file.startsWith(ROOT)) return null;
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, 'index.html');
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url || '/');
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const body = await readFile(file);
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`Performance Powerhouse running at http://localhost:${PORT}/`);
});
