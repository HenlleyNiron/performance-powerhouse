import { test, expect } from '@playwright/test';
import { APP_KEY, acceptDialogs, colomboToday, readState, seedState, trackErrors } from './helpers.mjs';

const payload = '<img src=x onerror="window.__pwned=(window.__pwned||0)+1">';

test('a crafted backup cannot inject markup or script into the dashboard', async ({ page }) => {
  acceptDialogs(page);
  await seedState(page);
  await page.goto('/');
  const hostile = {
    product: 'A/L Performance Powerhouse',
    core: {
      profileSetupComplete: true,
      profile: { name: payload, year: '2027', target: payload, line: payload },
      ratings: { 'physics|0|0': 1 },
      attempts: [
        {
          id: `x" onmouseover="window.__pwned=1`,
          date: colomboToday(),
          subject: payload,
          topicKey: `physics|0|0" data-x="${payload}`,
          type: 'topic-question',
          question: payload,
          earned: `1${payload}`,
          total: 10,
          minutes: 5,
          items: 1,
          guesses: 0,
          confidence: payload,
          error: payload,
          note: payload,
          createdAt: new Date().toISOString(),
          trustedEarned: null,
        },
      ],
      retests: [
        {
          id: payload,
          sourceAttemptId: 'x',
          topicKey: 'physics|0|0',
          due: payload,
          stage: 1,
          completedAt: null,
          failures: 0,
          attempts: [],
        },
      ],
      dailyEntries: [
        { id: `d" onclick="window.__pwned=1`, date: colomboToday(), note: payload, physics: { mcqs: 1 } },
      ],
    },
  };
  await page.locator('#data-btn').click();
  await page.locator('#import-file').setInputFiles({
    name: 'hostile.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(hostile)),
  });
  await page.waitForTimeout(300);
  for (const panel of [
    'command',
    'repairs',
    'attempts',
    'daily',
    'retests',
    'papers',
    'intelligence',
    'weekly',
  ]) {
    await page.evaluate(p => window.navigate(p), panel);
  }
  await page.mouse.move(10, 10);
  expect(await page.evaluate(() => window.__pwned || 0)).toBe(0);
  expect(await page.locator('main img[src="x"]').count()).toBe(0);
});

test('deleting the attempt that closed a retest reopens that retest', async ({ page }) => {
  acceptDialogs(page);
  const topicKey = 'chemistry|2|1';
  await seedState(page, {
    attempts: [
      {
        id: 'src',
        date: colomboToday(-9),
        subject: 'chemistry',
        topicKey,
        type: 'topic-question',
        question: 'Source',
        earned: 2,
        total: 5,
        minutes: 10,
        items: 1,
        guesses: 0,
        confidence: 'medium',
        error: 'M',
        note: '',
        createdAt: '2026-01-01T00:00:00Z',
        trustedEarned: null,
      },
      {
        id: 'xfer',
        date: colomboToday(-2),
        subject: 'chemistry',
        topicKey,
        type: 'fresh-transfer',
        question: 'Transfer',
        earned: 5,
        total: 5,
        minutes: 10,
        items: 1,
        guesses: 0,
        confidence: 'medium',
        error: '',
        note: '',
        createdAt: '2026-01-02T00:00:00Z',
        trustedEarned: null,
        retestId: 'rt-1',
      },
    ],
    retests: [
      {
        id: 'rt-1',
        sourceAttemptId: 'src',
        topicKey,
        due: colomboToday(-6),
        stage: 1,
        completedAt: colomboToday(-2),
        status: 'passed',
        lastAttemptId: 'xfer',
        failures: 0,
        attempts: [{ attemptId: 'xfer', date: colomboToday(-2), passed: true }],
      },
      {
        id: 'rt-2',
        sourceAttemptId: 'src',
        topicKey,
        due: colomboToday(-2),
        stage: 2,
        completedAt: null,
        failures: 0,
        attempts: [],
      },
    ],
  });
  await page.goto('/#attempts');
  await page.locator('[data-delete-attempt="xfer"]').click();
  const state = await readState(page);
  expect(state.attempts.map(a => a.id)).toEqual(['src']);
  const rt1 = state.retests.find(r => r.id === 'rt-1');
  expect(rt1.completedAt).toBeNull();
  expect(rt1.attempts).toEqual([]);
});

test('editing a full-credit attempt down to lost marks schedules its retests', async ({ page }) => {
  acceptDialogs(page);
  await seedState(page, {
    attempts: [
      {
        id: 'a1',
        date: colomboToday(-1),
        subject: 'biology',
        topicKey: 'biology|1|0',
        type: 'topic-question',
        question: 'Water',
        earned: 5,
        total: 5,
        minutes: 10,
        items: 1,
        guesses: 0,
        confidence: 'medium',
        error: '',
        note: '',
        createdAt: '2026-01-01T00:00:00Z',
        trustedEarned: null,
      },
    ],
  });
  await page.goto('/#attempts');
  await page.locator('[data-v5-edit-attempt="a1"]').click();
  await page.fill('#marks-earned', '3');
  await page.selectOption('#attempt-error', 'R');
  await page.locator('#attempt-dialog button[type="submit"]').click();
  const state = await readState(page);
  expect(state.attempts[0].earned).toBe(3);
  expect(
    state.retests
      .filter(r => r.sourceAttemptId === 'a1')
      .map(r => r.stage)
      .sort(),
  ).toEqual([1, 2]);
});

test('a malformed backup is rejected and leaves existing data untouched', async ({ page }) => {
  acceptDialogs(page);
  await seedState(page, {
    attempts: [
      {
        id: 'keep',
        date: colomboToday(),
        subject: 'physics',
        topicKey: 'physics|0|0',
        type: 'topic-question',
        question: 'Keep me',
        earned: 1,
        total: 1,
        minutes: 1,
        items: 1,
        guesses: 0,
        confidence: 'medium',
        error: '',
        note: '',
        createdAt: '2026-01-01T00:00:00Z',
        trustedEarned: null,
      },
    ],
  });
  const errors = trackErrors(page);
  await page.goto('/');
  await page.locator('#data-btn').click();
  await page.locator('#import-file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"attempts": "nope", "ratings": 5'),
  });
  await expect(page.locator('#toast')).toContainText(/not valid JSON/i);
  expect((await readState(page)).attempts.map(a => a.id)).toEqual(['keep']);
  expect(errors.filter(e => e.startsWith('pageerror'))).toEqual([]);
  expect(await page.evaluate(key => localStorage.getItem(key) !== null, APP_KEY)).toBe(true);
});

const TRACKER_KEY = 'al_performance_powerhouse_study_tracker_v1';
const PHYSICS_KEY = 'al_performance_powerhouse_physics_intelligence_v1';
const trackerSession = (overrides = {}) => ({
  id: 'sess-ok',
  date: colomboToday(),
  subject: 'physics',
  type: 'mcq-set',
  task: 'Kinematics MCQs',
  status: 'complete',
  output: 'marked-attempt',
  evidenceClass: 'evidence',
  durationMs: 1800000,
  createdAt: new Date().toISOString(),
  endedAt: new Date().toISOString(),
  ...overrides,
});

test('stored Study Tracker data cannot inject markup or break the page, and nothing is lost', async ({
  page,
}) => {
  const errors = trackErrors(page);
  const stored = {
    sessions: [
      trackerSession(),
      trackerSession({
        id: `"><b id="pwned-id">x</b><i x="`,
        date: '<b id="pwned-date">d</b>',
        createdAt: `${colomboToday()}T06:00:00.000Z`,
      }),
      trackerSession({ id: 'bad-subject', subject: 7 }),
    ],
    activeSession: null,
  };
  await page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem('__seeded')) {
        localStorage.setItem(key, value);
        sessionStorage.setItem('__seeded', '1');
      }
    },
    [TRACKER_KEY, JSON.stringify(stored)],
  );
  await page.goto('/study-tracker/');
  await expect(page.locator('#history')).toContainText('Kinematics MCQs');
  expect(await page.locator('#pwned-id, #pwned-date, b#pwned-id').count()).toBe(0);
  expect(errors.filter(e => e.startsWith('pageerror'))).toEqual([]);
  // The hostile session is repaired (date from createdAt, fresh id); the one with no
  // valid subject is skipped, but the original record is kept for recovery first.
  const recovery = await page.evaluate(k => JSON.parse(localStorage.getItem(`${k}_recovery`)), TRACKER_KEY);
  expect(recovery[0].label).toMatch(/pre-validation:1-invalid/);
  expect(recovery[0].state.sessions).toHaveLength(3);
  const kept = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).sessions, TRACKER_KEY);
  expect(kept).toHaveLength(2);
  expect(kept[0].id).toBe('sess-ok');
  expect(kept[1].id).toMatch(/^[A-Za-z0-9._:-]+$/);
  expect(kept[1].date).toBe(colomboToday());
  // Reloading does not pile up duplicate recovery snapshots.
  await page.reload();
  const again = await page.evaluate(k => JSON.parse(localStorage.getItem(`${k}_recovery`)), TRACKER_KEY);
  expect(again).toHaveLength(1);
});

test('restoring a unified backup snapshots existing companion data before replacing it', async ({ page }) => {
  const messages = [];
  page.on('dialog', dialog => {
    messages.push(dialog.message());
    dialog.accept();
  });
  await seedState(page);
  const previousTracker = { sessions: [trackerSession({ id: 'mine', task: 'My own session' })] };
  const previousPhysics = {
    version: 1,
    attempts: [{ familyId: 'FAM126', outcome: 'wrong', timeSeconds: 80 }],
  };
  await page.addInitScript(
    ([t, tv, p, pv]) => {
      if (!sessionStorage.getItem('__companions')) {
        localStorage.setItem(t, tv);
        localStorage.setItem(p, pv);
        sessionStorage.setItem('__companions', '1');
      }
    },
    [TRACKER_KEY, JSON.stringify(previousTracker), PHYSICS_KEY, JSON.stringify(previousPhysics)],
  );
  await page.goto('/');
  const backup = {
    product: 'A/L Performance Powerhouse',
    core: { profileSetupComplete: true, ratings: {}, attempts: [], retests: [] },
    study_tracker: {
      sessions: [trackerSession({ id: 'restored' }), trackerSession({ id: `<b>`, subject: '<b>' })],
    },
    physics_intelligence: {
      attempts: [
        { familyId: 'FAM126', outcome: 'correct', timeSeconds: 60 },
        { familyId: 'FAM126', outcome: '<img src=x>', timeSeconds: 60 },
      ],
    },
  };
  await page.locator('#data-btn').click();
  await page.locator('#import-file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.locator('#toast')).toContainText(/2 invalid record/);
  expect(messages[0]).toMatch(/1 Study Tracker session\(s\), 1 Physics Intelligence attempt\(s\)/);
  expect(messages[0]).toMatch(/Study Tracker sessions and Physics Intelligence attempts will be replaced/);
  const stored = await page.evaluate(
    ([t, p]) => ({
      tracker: JSON.parse(localStorage.getItem(t)),
      trackerRecovery: JSON.parse(localStorage.getItem(`${t}_recovery`)),
      physics: JSON.parse(localStorage.getItem(p)),
      physicsRecovery: JSON.parse(localStorage.getItem(`${p}_recovery`)),
    }),
    [TRACKER_KEY, PHYSICS_KEY],
  );
  expect(stored.tracker.sessions.map(s => s.id)).toEqual(['restored']);
  expect(stored.physics.attempts.map(a => a.outcome)).toEqual(['correct']);
  expect(stored.trackerRecovery[0].state).toEqual(previousTracker);
  expect(stored.physicsRecovery[0].state).toEqual(previousPhysics);
});

test('Physics Intelligence validates stored attempts and reports a bad import file', async ({ page }) => {
  const errors = trackErrors(page);
  const stored = {
    version: 1,
    attempts: [
      { familyId: 'FAM126', outcome: 'wrong', timeSeconds: 80, confidence: 4 },
      { familyId: 'FAM126', outcome: '<b id="pwned">x</b>', timeSeconds: 80, confidence: 4 },
      { familyId: 'FAM126', outcome: 'slow', timeSeconds: 'later', confidence: 4 },
    ],
  };
  await page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem('__seeded')) {
        localStorage.setItem(key, value);
        sessionStorage.setItem('__seeded', '1');
      }
    },
    [PHYSICS_KEY, JSON.stringify(stored)],
  );
  await page.goto('/physics-intelligence/');
  const table = page.locator('#opportunityTable');
  await expect(table).toContainText('1 wrong');
  await expect(table).not.toContainText('NaN');
  expect(await page.locator('#pwned').count()).toBe(0);
  await page.locator('#importBackup').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not json'),
  });
  await expect(page.locator('#importStatus')).toContainText(/not valid JSON/);
  await expect(table).toContainText('1 wrong');
  expect(errors.filter(e => e.startsWith('pageerror'))).toEqual([]);
});
