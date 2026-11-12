import { test, expect } from '@playwright/test';
import { acceptDialogs, seedState } from './helpers.mjs';
import { FROZEN_NOW, chainStatesRecord } from './fixtures/chain-states.mjs';

// Regression safety net for refactors: the visible text of every panel, with the
// clock frozen, must not change unless a change is intended.
//
// Text (not pixel) snapshots are used on purpose: they do not depend on fonts,
// GPUs or anti-aliasing, so they are identical on every machine and in CI.
//
// Intended change? Review the diff, then run:  npm run test:snapshots:update

/** Collapses whitespace-only differences so only wording and numbers matter. */
const tidy = text =>
  text
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n') + '\n';

async function freeze(page) {
  await page.clock.setFixedTime(new Date(FROZEN_NOW));
}

async function panelTexts(page) {
  const panels = await page
    .locator('#app-tabs [data-panel]')
    .evaluateAll(tabs => tabs.map(t => t.dataset.panel));
  const out = {};
  for (const panel of panels) {
    await page.evaluate(p => window.navigate(p), panel);
    out[panel] = tidy(await page.locator(`#panel-${panel}`).innerText());
  }
  return out;
}

test.describe('panel text snapshots', () => {
  test.beforeEach(async ({ page }) => {
    acceptDialogs(page);
    await freeze(page);
  });

  test('demo record: every panel', async ({ page }) => {
    await page.goto('/?demo=1');
    const texts = await panelTexts(page);
    expect(Object.keys(texts).length).toBeGreaterThanOrEqual(10);
    for (const [panel, text] of Object.entries(texts)) {
      expect(text, `panel ${panel}`).toMatchSnapshot(`demo-${panel}.txt`);
    }
  });

  test('every evidence-chain state: every panel', async ({ page }) => {
    await seedState(page, chainStatesRecord());
    await page.goto('/');
    // The fixture must really contain each lifecycle state, or the snapshot proves nothing.
    const states = await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem('al_performance_powerhouse_v5'));
      // The relapse attempt is itself a new weakness, so 'Diagnosed' appears twice.
      return [...new Set(window.PowerhouseCore.evidenceModel(record).chains.map(c => c.lifecycle))].sort();
    });
    expect(states).toEqual(
      [
        'Closed',
        'Delayed retest due',
        'Diagnosed',
        'Fresh transfer due',
        'Open',
        'Reattempt due',
        'Reopened',
        'Repair planned',
      ].sort(),
    );
    const texts = await panelTexts(page);
    for (const [panel, text] of Object.entries(texts)) {
      expect(text, `panel ${panel}`).toMatchSnapshot(`chains-${panel}.txt`);
    }
  });

  test('first-run welcome dialog', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#welcome-dialog')).toBeVisible();
    expect(tidy(await page.locator('#welcome-dialog').innerText())).toMatchSnapshot('welcome.txt');
  });

  test('Physics Intelligence', async ({ page }) => {
    await page.goto('/physics-intelligence/');
    await expect(page.locator('body')).toContainText('1,410');
    await page.waitForLoadState('networkidle');
    expect(tidy(await page.locator('main').innerText())).toMatchSnapshot('physics-intelligence.txt');
  });

  test('Study Tracker (empty)', async ({ page }) => {
    await page.goto('/study-tracker/');
    await expect(page.locator('#start-btn')).toBeVisible();
    expect(tidy(await page.locator('main').innerText())).toMatchSnapshot('study-tracker.txt');
  });
});
