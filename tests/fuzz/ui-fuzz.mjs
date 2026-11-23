#!/usr/bin/env node
// UI fuzzer: generates random student histories, loads each one into a real browser,
// visits every panel and reports crashes or visibly broken text (NaN, undefined,
// Infinity, [object Object]). Unit tests prove the core's rules; this checks that
// the rendering code survives the data those rules allow.
//
//   npm run fuzz:ui                      # 60 histories, fixed seed
//   FUZZ_RUNS=300 FUZZ_SEED=7 npm run fuzz:ui
//
// It starts its own static server on a free port and exits non-zero on any finding,
// printing the seed and history index so the failure can be replayed.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import fc from 'fast-check';
import { chromium } from '@playwright/test';
import { loadCore } from '../unit/load-core.mjs';

const RUNS = Number(process.env.FUZZ_RUNS || 60);
const SEED = Number(process.env.FUZZ_SEED || 20271101);
const APP_KEY = 'al_performance_powerhouse_v5';
const PANELS = [
  'command',
  'repairs',
  'attempts',
  'daily',
  'retests',
  'papers',
  'intelligence',
  'weekly',
  'study-tracker',
  'course',
  'physics',
  'chemistry',
  'biology',
  'guide',
];
const BROKEN_TEXT = /\bNaN\b|\bundefined\b|-?Infinity\b|\[object Object\]/;

// ------------------------------------------------------------------ generators
const core = loadCore();
const SUBJECTS = core.SUBJECTS;
const TYPES = Object.keys(core.ATTEMPT_TYPE_NAMES);
const ERRORS = ['', ...Object.keys(core.ERROR_NAMES)];
const CONFIDENCE = core.CONFIDENCE_LEVELS;
const today = new Date();
const dayOffset = n => {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + n));
  return d.toISOString().slice(0, 10);
};
const date = fc.integer({ min: -400, max: 30 }).map(dayOffset);
const id = fc.stringMatching(/^[a-z0-9]{4,10}$/);

const attempt = fc
  .record({
    id,
    date,
    subject: fc.constantFrom(...SUBJECTS),
    unit: fc.integer({ min: 0, max: 12 }),
    topic: fc.integer({ min: 0, max: 8 }),
    type: fc.constantFrom(...TYPES),
    question: fc.string({ maxLength: 30 }),
    total: fc.integer({ min: 0, max: 100 }),
    ratio: fc.double({ min: 0, max: 1.2, noNaN: true }),
    trusted: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: null }),
    minutes: fc.integer({ min: 0, max: 400 }),
    items: fc.integer({ min: 0, max: 60 }),
    guesses: fc.integer({ min: 0, max: 10 }),
    confidence: fc.constantFrom(...CONFIDENCE),
    error: fc.constantFrom(...ERRORS),
  })
  .map(a => ({
    id: a.id,
    date: a.date,
    subject: a.subject,
    topicKey: `${a.subject}|${a.unit}|${a.topic}`,
    type: a.type,
    question: a.question,
    earned: Math.round(a.total * a.ratio),
    total: a.total,
    trustedEarned: a.trusted === null ? null : Math.round(a.total * a.trusted),
    minutes: a.minutes,
    items: a.items,
    guesses: a.guesses,
    confidence: a.confidence,
    error: a.error,
    note: '',
    createdAt: `${a.date}T08:00:00.000Z`,
  }));

const daily = fc.record({
  id,
  date,
  note: fc.string({ maxLength: 20 }),
  physics: fc.record({ mcqs: fc.integer({ min: 0, max: 80 }) }),
  chemistry: fc.record({ mcqs: fc.integer({ min: 0, max: 80 }) }),
  biology: fc.record({ mcqs: fc.integer({ min: 0, max: 80 }) }),
});

const history = fc.record({
  attempts: fc.array(attempt, { maxLength: 40 }),
  dailyEntries: fc.array(daily, { maxLength: 10 }),
  ratings: fc.dictionary(
    fc.tuple(fc.constantFrom(...SUBJECTS), fc.nat(10), fc.nat(8)).map(([s, u, t]) => `${s}|${u}|${t}`),
    fc.integer({ min: 0, max: 3 }),
    { maxKeys: 15 },
  ),
});

/**
 * Replays the history in date order through the core's own retest rules, so the
 * retest, chain and weekly panels are fuzzed with realistic open, passed, failed
 * and overdue checks rather than an empty list.
 */
function withRetests(sample) {
  const retests = [];
  let n = 0;
  const ordered = [...sample.attempts].sort((a, b) => a.date.localeCompare(b.date));
  for (const attempt of ordered) {
    const closed = core.applyRetestOutcome(retests, attempt);
    if (closed) attempt.retestId = closed.id;
    retests.push(...core.createRetests(attempt, undefined, () => `rt${n++}`));
  }
  return { ...sample, attempts: ordered, retests };
}

// ----------------------------------------------------------------------- server
async function freePort() {
  return new Promise(resolve => {
    const srv = createServer().listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function main() {
  const port = await freePort();
  const server = spawn(process.execPath, ['scripts/serve.mjs', String(port)], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 400));
  const browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
  const samples = fc.sample(history, { numRuns: RUNS, seed: SEED });
  const findings = [];

  try {
    for (const [index, sample] of samples.entries()) {
      const context = await browser.newContext({ serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
      page.on('console', m => m.type() === 'error' && errors.push(`console: ${m.text()}`));
      page.on('dialog', d => d.accept());
      const seed = {
        profileSetupComplete: true,
        profile: { name: 'Fuzz', year: '2027', target: '', line: '' },
        ...withRetests(sample),
      };
      await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [APP_KEY, JSON.stringify(seed)]);
      await page.goto(`http://127.0.0.1:${port}/`);
      for (const panel of PANELS) {
        await page.evaluate(p => window.navigate(p), panel);
        const text = await page
          .locator(`#panel-${panel}`)
          .innerText()
          .catch(() => '');
        const bad = text.split('\n').find(line => BROKEN_TEXT.test(line));
        if (bad) errors.push(`broken text in ${panel}: "${bad.trim().slice(0, 140)}"`);
      }
      if (errors.length) {
        findings.push({ index, errors: [...new Set(errors)] });
        console.log(`✗ history ${index}:`, [...new Set(errors)].join('\n    '));
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }

  console.log(`\n${RUNS} histories, seed ${SEED}: ${findings.length} with findings.`);
  if (findings.length) {
    console.log(`Replay one with: FUZZ_SEED=${SEED} FUZZ_RUNS=${findings[0].index + 1} npm run fuzz:ui`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
