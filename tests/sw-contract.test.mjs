import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../sw.js', import.meta.url), 'utf8');

test('uses a product-scoped cache namespace', () => {
  assert.match(source, /const CACHE_PREFIX = 'powerhouse-'/);
  assert.match(source, /key\.startsWith\(CACHE_PREFIX\) && key !== CACHE/);
  assert.doesNotMatch(source, /filter\(key\s*=>\s*key\s*!==\s*CACHE\)/);
});

test('limits runtime caching to the declared application assets', () => {
  assert.match(source, /const CACHEABLE_URLS = new Set/);
  assert.match(source, /const isAppAsset = CACHEABLE_URLS\.has\(normalizedUrl\.href\)/);
  assert.match(source, /if \(isAppAsset && canStore\(response\)\)/);
});

test('does not store private or no-store responses', () => {
  assert.match(source, /response\.headers\.get\('cache-control'\)/);
  assert.match(source, /no-store\|private/);
});

test('extends the fetch-event lifetime for cache writes', () => {
  assert.match(source, /const cacheWrite = caches\.open\(CACHE\)/);
  assert.match(source, /event\.waitUntil\(cacheWrite\)/);
});

test('reads offline responses only from the Powerhouse cache', () => {
  assert.match(source, /const cache = await caches\.open\(CACHE\)/);
  assert.match(source, /await cache\.match\(request, \{ ignoreSearch: true \}\)/);
  assert.doesNotMatch(source, /caches\.match\(event\.request/);
});

test('retains explicit offline navigation fallbacks', () => {
  assert.match(source, /study-tracker\/index\.html/);
  assert.match(source, /physics-intelligence\/index\.html/);
  assert.match(source, /return cache\.match\('\.\/index\.html'\)/);
});

test('ignores non-GET and cross-origin traffic', () => {
  assert.match(source, /request\.method !== 'GET'/);
  assert.match(source, /url\.origin !== self\.location\.origin/);
});
