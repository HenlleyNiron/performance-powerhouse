import { test, expect } from '@playwright/test';
import { acceptDialogs, readState, seedState, trackErrors } from './helpers.mjs';

const TRACKER_KEY = 'al_performance_powerhouse_study_tracker_v1';

test.describe('Study Tracker → evidence ledger hand-off', () => {
  test('a finished tracker session opens a prefilled attempt and links back to the session', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    acceptDialogs(page);
    await seedState(page);
    await page.addInitScript(
      ([key, value]) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, value);
      },
      [
        TRACKER_KEY,
        JSON.stringify({
          version: 1,
          sessions: [
            {
              id: 'sess-1',
              date: '2026-10-20',
              subject: 'chemistry',
              type: 'closed-book-reattempt',
              task: 'Kc reattempt',
              status: 'complete',
              durationMs: 25 * 60000,
            },
          ],
          activeSession: null,
          settings: {},
        }),
      ],
    );

    await page.goto(
      '/?logEvidence=1&subject=chemistry&type=reattempt&sessionId=sess-1&minutes=25&question=Kc%20reattempt',
    );
    const dialog = page.locator('#attempt-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#attempt-subject')).toHaveValue('chemistry');
    await expect(page.locator('#attempt-type')).toHaveValue('reattempt');
    await expect(page.locator('#attempt-minutes')).toHaveValue('25');
    await expect(page.locator('#attempt-question')).toHaveValue('Kc reattempt');
    // The query string is removed so a reload cannot log the same session twice.
    expect(new URL(page.url()).search).toBe('');

    await page.fill('#marks-earned', '8');
    await page.fill('#marks-total', '8');
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).toBeHidden();

    const state = await readState(page);
    expect(state.attempts).toHaveLength(1);
    expect(state.attempts[0].sessionId).toBe('sess-1');
    const tracker = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), TRACKER_KEY);
    expect(tracker.sessions[0].linkedAttemptId).toBe(state.attempts[0].id);
    expect(errors).toEqual([]);
  });
});

test.describe('offline use (service worker)', () => {
  test.use({ serviceWorkers: 'allow' });

  test('the app, Physics Intelligence and Study Tracker load with no network', async ({ page, context }) => {
    acceptDialogs(page);
    await seedState(page);
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise(resolve =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
        );
      }
    });
    // Wait until the precache is complete before cutting the network.
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const keys = await caches.keys();
          const cache = await caches.open(keys.find(k => k.startsWith('powerhouse-')));
          return (await cache.keys()).length;
        }),
      )
      .toBeGreaterThan(15);

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#app-tabs')).toBeVisible();
    await expect(page.locator('#identity-line')).toContainText('Test Student');

    await page.goto('/physics-intelligence/');
    await expect(page.locator('body')).toContainText('1,410');

    await page.goto('/study-tracker/');
    await expect(page.locator('#start-btn')).toBeVisible();
    await context.setOffline(false);
  });
});

test.describe('performance with a long study history', () => {
  test('a full dashboard refresh with 3,000 attempts stays responsive', async ({ page }) => {
    acceptDialogs(page);
    const subjects = ['physics', 'chemistry', 'biology'];
    const errors = ['K', 'C', 'R', 'M', 'P', 'T', 'A', 'G', ''];
    let seed = 7;
    const rand = n => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    const attempts = [];
    const retests = [];
    for (let i = 0; i < 3000; i += 1) {
      const subject = subjects[rand(3)];
      const date = `2026-${String(1 + rand(10)).padStart(2, '0')}-${String(1 + rand(28)).padStart(2, '0')}`;
      const total = [5, 10, 20][rand(3)];
      const error = errors[rand(errors.length)];
      const topicKey = `${subject}|${rand(7)}|${rand(9)}`;
      attempts.push({
        id: `a${i}`,
        date,
        subject,
        topicKey,
        type: 'topic-question',
        question: 'q',
        earned: error ? rand(total) : total,
        total,
        minutes: 10,
        confidence: ['low', 'medium', 'high'][rand(3)],
        error,
        createdAt: `${date}T00:00:00Z`,
      });
      if (error)
        retests.push({
          id: `r${i}`,
          sourceAttemptId: `a${i}`,
          topicKey,
          due: date,
          stage: 1,
          completedAt: null,
          attempts: [],
        });
    }
    await seedState(page, { attempts, retests });
    await page.goto('/');
    const median = await page.evaluate(() => {
      const times = [];
      for (let i = 0; i < 5; i += 1) {
        const t0 = performance.now();
        window.refreshAll();
        times.push(performance.now() - t0);
      }
      return times.sort((x, y) => x - y)[2];
    });
    test.info().annotations.push({ type: 'refreshAll median (ms)', description: String(Math.round(median)) });
    // 5.1.1 took ~9 s here; 5.2.0 takes ~0.2 s locally. The bound leaves room for slow CI runners.
    expect(median).toBeLessThan(1500);
  });
});
