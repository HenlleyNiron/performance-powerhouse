// Static integrity checks: catch broken references before a browser ever loads the app.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadCore } from './load-core.mjs';

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const read = rel => readFileSync(join(ROOT, rel), 'utf8');
const PAGES = ['index.html', 'community-share.html', 'physics-intelligence/index.html', 'study-tracker/index.html'];

const idsIn = html => [...html.matchAll(/\sid="([^"$]+)"/g)].map(m => m[1]);

describe('HTML pages', () => {
  for (const page of PAGES) {
    const html = read(page);

    test(`${page}: element ids are unique`, () => {
      const ids = idsIn(html);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      assert.deepEqual(dupes, []);
    });

    test(`${page}: every local href/src resolves to a file`, () => {
      const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map(m => m[1])
        .filter(r => !/^(https?:|mailto:|#|data:|javascript:)/.test(r));
      const missing = refs.filter(ref => {
        const clean = ref.split(/[?#]/)[0];
        if (!clean) return false;
        const target = join(ROOT, dirname(page), clean);
        return !(existsSync(target) || existsSync(join(target, 'index.html')));
      });
      assert.deepEqual(missing, []);
    });

    test(`${page}: ships a Content-Security-Policy without unsafe script sources`, () => {
      const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
      assert.ok(csp, 'CSP meta tag missing');
      const scriptSrc = csp[1].split(';').map(s => s.trim()).find(s => s.startsWith('script-src'));
      assert.equal(scriptSrc, "script-src 'self'");
    });

    test(`${page}: has no inline scripts or inline event handlers`, () => {
      const inlineScripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>/g)];
      assert.equal(inlineScripts.length, 0);
      assert.doesNotMatch(html, /\son[a-z]+\s*=\s*["']/i);
    });
  }
});

describe('main application wiring', () => {
  const html = read('index.html');
  const scripts = ['js/app.js', 'js/v5-additions.js'].map(read).join('\n');

  test('every element the scripts look up by id exists in the page or is created by a script', () => {
    const available = new Set([...idsIn(html), ...[...scripts.matchAll(/id=["'`]([a-z0-9-]+)["'`]/gi)].map(m => m[1]), ...[...scripts.matchAll(/id="([a-z0-9-]+)\$\{/gi)].map(m => m[1])]);
    const referenced = new Set([
      ...[...scripts.matchAll(/\$\('([a-z0-9-]+)'\)/gi)].map(m => m[1]),
      ...[...scripts.matchAll(/getElementById\('([a-z0-9-]+)'\)/gi)].map(m => m[1]),
      ...[...scripts.matchAll(/q\('#([a-z0-9-]+)'\)/gi)].map(m => m[1]),
    ]);
    const missing = [...referenced].filter(id => !available.has(id));
    assert.deepEqual(missing, []);
  });

  test('scripts load in dependency order: core → app → v5 extensions', () => {
    const order = [...html.matchAll(/<script src="\.\/([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(order, ['js/core.js', 'js/app.js', 'js/v5-additions.js']);
  });
});

describe('offline shell and packaging', () => {
  test('every service-worker precache asset exists', () => {
    const sw = read('sw.js');
    const assets = [...sw.matchAll(/^\s+'(\.\/[^']*)',$/gm)].map(m => m[1]);
    assert.ok(assets.length > 10);
    const missing = assets.filter(a => {
      const p = join(ROOT, a);
      return !(existsSync(p) && (a.endsWith('/') ? existsSync(join(p, 'index.html')) : true));
    });
    assert.deepEqual(missing, []);
  });

  test('the service-worker cache name tracks the release version', () => {
    const { version } = JSON.parse(read('package.json'));
    assert.match(read('sw.js'), new RegExp(`v${version.replaceAll('.', '\\.')}`));
  });

  test('package version and core build agree', () => {
    const { version } = JSON.parse(read('package.json'));
    assert.equal(loadCore().BUILD, version);
  });

  test('web manifest is valid and its icons exist', () => {
    const manifest = JSON.parse(read('manifest.webmanifest'));
    assert.ok(manifest.name && manifest.start_url);
    for (const icon of manifest.icons) assert.ok(existsSync(join(ROOT, icon.src)), icon.src);
  });

  test('Physics Intelligence dataset is well-formed aggregate data', () => {
    const data = JSON.parse(read('physics-intelligence/assets/physics-intelligence-data.json'));
    const text = JSON.stringify(data);
    assert.ok(text.includes('2025'), 'expected coverage through 2025');
    assert.ok(Array.isArray(data.currentFamilies) && data.currentFamilies.length > 100);
  });
});
