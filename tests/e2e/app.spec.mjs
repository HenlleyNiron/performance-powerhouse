import { test, expect } from '@playwright/test';
import { APP_KEY, V4_KEY, acceptDialogs, colomboToday, logAttempt, readState, seedState, trackErrors } from './helpers.mjs';

test.describe('first run', () => {
  test('onboarding creates a private profile', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    const welcome = page.locator('#welcome-dialog');
    await expect(welcome).toBeVisible();
    await page.fill('#welcome-name', 'Asha');
    await welcome.locator('button[type="submit"]').click();
    await expect(welcome).toBeHidden();
    await expect(page.locator('#identity-line')).toContainText('Asha');
    const state = await readState(page);
    expect(state.profileSetupComplete).toBe(true);
    expect(state.profile.name).toBe('Asha');
    expect(errors).toEqual([]);
  });
});

test.describe('navigation', () => {
  test('every dashboard section opens without runtime errors', async ({ page }) => {
    const errors = trackErrors(page);
    acceptDialogs(page);
    await seedState(page);
    await page.goto('/');
    const panels = await page.locator('#app-tabs [data-panel]').evaluateAll(tabs => tabs.map(t => t.dataset.panel));
    expect(panels.length).toBeGreaterThanOrEqual(10);
    for (const panel of panels) {
      await page.locator(`#app-tabs [data-panel="${panel}"]`).click();
      await expect(page.locator(`#panel-${panel}`)).toHaveClass(/active/);
    }
    expect(errors).toEqual([]);
  });

  test('deep link opens a section from the URL hash', async ({ page }) => {
    await seedState(page);
    await page.goto('/#repairs');
    await expect(page.locator('#panel-repairs')).toHaveClass(/active/);
  });
});

test.describe('evidence loop', () => {
  test('a lost-mark attempt schedules a two-stage retest and a repair priority', async ({ page }) => {
    const errors = trackErrors(page);
    await seedState(page);
    await page.goto('/');
    await logAttempt(page, { earned: 6, total: 10, error: 'C', confidence: 'high' });
    const state = await readState(page);
    expect(state.attempts).toHaveLength(1);
    expect(state.retests.map(r => r.stage).sort()).toEqual([1, 2]);
    expect(state.retests.every(r => r.sourceAttemptId === state.attempts[0].id)).toBe(true);
    await page.locator('#app-tabs [data-panel="repairs"]').click();
    await expect(page.locator('#repair-priority-list .queue-item')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('full credit with no guesses schedules no retest', async ({ page }) => {
    await seedState(page);
    await page.goto('/');
    await logAttempt(page, { earned: 10, total: 10 });
    const state = await readState(page);
    expect(state.attempts).toHaveLength(1);
    expect(state.retests).toHaveLength(0);
  });

  test('lost marks require an error family before saving', async ({ page }) => {
    await seedState(page);
    await page.goto('/');
    await page.locator('#quick-log-btn').click();
    await page.fill('#attempt-question', 'Missing diagnosis');
    await page.fill('#marks-earned', '3');
    await page.fill('#marks-total', '10');
    await page.fill('#attempt-minutes', '10');
    await page.locator('#attempt-dialog button[type="submit"]').click();
    await expect(page.locator('#attempt-dialog')).toBeVisible();
    await expect(page.locator('#toast')).toContainText('error family');
    expect((await readState(page)).attempts).toHaveLength(0);
  });

  test('one fresh-transfer pass closes only the matching retest stage', async ({ page }) => {
    const source = '2026-01-01';
    const topicKey = 'physics|1|2';
    await seedState(page, {
      attempts: [{ id: 'src-1', date: colomboToday(-10), subject: 'physics', topicKey, type: 'topic-question', question: 'Source', earned: 4, total: 10, minutes: 20, items: 1, guesses: 0, confidence: 'medium', error: 'M', note: '', createdAt: `${source}T00:00:00Z`, trustedEarned: null }],
      retests: [
        { id: 'rt-1', sourceAttemptId: 'src-1', topicKey, due: colomboToday(-7), stage: 1, completedAt: null, failures: 0, attempts: [] },
        { id: 'rt-2', sourceAttemptId: 'src-1', topicKey, due: colomboToday(-3), stage: 2, completedAt: null, failures: 0, attempts: [] },
      ],
    });
    await page.goto('/');
    await page.locator('#retest-queue [data-retest-id="rt-1"]').click();
    await expect(page.locator('#attempt-dialog')).toBeVisible();
    await expect(page.locator('#attempt-type')).toHaveValue('fresh-transfer');
    await page.fill('#attempt-question', 'Fresh transfer');
    await page.fill('#marks-earned', '10');
    await page.fill('#marks-total', '10');
    await page.fill('#attempt-minutes', '15');
    await page.locator('#attempt-dialog button[type="submit"]').click();
    const state = await readState(page);
    const byId = Object.fromEntries(state.retests.map(r => [r.id, r]));
    expect(byId['rt-1'].completedAt).toBe(colomboToday());
    expect(byId['rt-1'].status).toBe('passed');
    expect(byId['rt-2'].completedAt).toBeNull();
  });
});

test.describe('privacy and data safety', () => {
  test('share-safe mode can be forced from the URL', async ({ page }) => {
    await seedState(page);
    await page.goto('/?share=1');
    await expect(page.locator('body')).toHaveClass(/share-safe/);
  });

  test('a V4 record is migrated into V5 without touching the V4 key', async ({ page }) => {
    const v4 = {
      productVersion: 'V4', profileSetupComplete: true,
      profile: { name: 'Legacy Learner', year: '2026', target: '', line: '' },
      ratings: { 'biology|0|0': 1 },
      attempts: [{ id: 'old-1', date: '2026-08-01', subject: 'biology', topicKey: 'biology|0|0', question: 'Old', earned: 5, total: 5, minutes: 10, confidence: 'medium', error: '', createdAt: '2026-08-01T00:00:00Z' }],
      retests: [],
    };
    await page.addInitScript(([key, value]) => {
      if (!sessionStorage.getItem('__seeded')) { localStorage.setItem(key, value); sessionStorage.setItem('__seeded', '1'); }
    }, [V4_KEY, JSON.stringify(v4)]);
    await page.goto('/');
    const migrated = await readState(page);
    expect(migrated.profile.name).toBe('Legacy Learner');
    expect(migrated.attempts).toHaveLength(1);
    expect(migrated.productVersion).toBe('V5');
    const original = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), V4_KEY);
    expect(original.productVersion).toBe('V4');
    const recovery = await page.evaluate(() => JSON.parse(localStorage.getItem('al_performance_powerhouse_v5_recovery') || '[]'));
    expect(recovery.some(r => String(r.label).startsWith('pre-v5-migration'))).toBe(true);
  });

  test('backup export round-trips through import', async ({ page }) => {
    acceptDialogs(page);
    await seedState(page);
    await page.goto('/');
    await logAttempt(page, { earned: 7, total: 10, error: 'R' });
    await page.locator('#data-btn').click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#export-data').click()]);
    const backup = JSON.parse(await (await download.createReadStream()).toArray().then(chunks => Buffer.concat(chunks).toString('utf8')));
    expect(backup.product).toBe('A/L Performance Powerhouse');
    expect(backup.core.attempts).toHaveLength(1);

    // Wipe local data, then restore from the exported file.
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ profileSetupComplete: true, attempts: [], retests: [], ratings: {} })), APP_KEY);
    await page.reload();
    await page.locator('#data-btn').click();
    await page.locator('#import-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await expect.poll(async () => (await readState(page)).attempts.length).toBe(1);
  });
});

test.describe('companion modules', () => {
  test('Physics Intelligence loads its validated dataset', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/physics-intelligence/');
    await expect(page.locator('body')).toContainText('1,410');
    expect(errors).toEqual([]);
  });

  test('Study Tracker loads', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/study-tracker/');
    await expect(page.locator('body')).toContainText(/Study Tracker/i);
    expect(errors).toEqual([]);
  });

  test('community share launcher links to share-safe entry points', async ({ page }) => {
    await page.goto('/community-share.html');
    const hrefs = await page.locator('a[href]').evaluateAll(as => as.map(a => a.getAttribute('href')));
    expect(hrefs.some(h => h.includes('share=1'))).toBe(true);
  });
});

test.describe('demo mode', () => {
  test('?demo=1 shows a populated, clearly labelled record and writes nothing to storage', async ({ page }) => {
    const errors = trackErrors(page);
    acceptDialogs(page);
    await page.goto('/?demo=1');
    await expect(page.locator('.demo-banner')).toContainText('Demo mode');
    await expect(page.locator('#welcome-dialog')).toBeHidden();
    await expect(page.locator('#attempt-count')).not.toHaveText('0');
    for (const panel of ['repairs', 'attempts', 'retests', 'intelligence', 'weekly', 'papers', 'daily']) {
      await page.evaluate(p => window.navigate(p), panel);
    }
    await page.evaluate(() => window.navigate('repairs'));
    await expect(page.locator('#repair-priority-list .queue-item').first()).toBeVisible();
    expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('al_performance_powerhouse')))).toEqual([]);
    expect(errors).toEqual([]);
  });
});
