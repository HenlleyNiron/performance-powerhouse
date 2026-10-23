import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { acceptDialogs } from './helpers.mjs';

// WCAG 2.1 A/AA rules checked by axe-core. Each panel is audited in demo mode so
// every list, chart and table has content to inspect.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function summarise(violations) {
  return violations.map(v => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
}

async function audit(page, include) {
  let builder = new AxeBuilder({ page }).withTags(TAGS);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  return summarise(violations);
}

test.describe('accessibility (axe, WCAG 2.1 AA)', () => {
  // A full axe pass over every panel is thorough rather than fast.
  test.describe.configure({ timeout: 120_000 });

  test('main app panels', async ({ page }) => {
    acceptDialogs(page);
    await page.goto('/?demo=1');
    const panels = await page.locator('#app-tabs [data-panel]').evaluateAll(tabs => tabs.map(t => t.dataset.panel));
    const report = {};
    for (const panel of panels) {
      await page.evaluate(p => window.navigate(p), panel);
      const found = await audit(page);
      if (found.length) report[panel] = found;
    }
    expect(report).toEqual({});
  });

  test('attempt, data and timer dialogs', async ({ page }) => {
    acceptDialogs(page);
    await page.goto('/?demo=1');
    const report = {};
    await page.locator('#quick-log-btn').click();
    report.attempt = await audit(page, '#attempt-dialog');
    await page.locator('#attempt-dialog [data-close-dialog]').first().click();
    await page.locator('#data-btn').click();
    report.data = await audit(page, '#data-dialog');
    await page.locator('#data-dialog [data-close-data]').first().click();
    await page.locator('#start-focus-btn').click();
    report.timer = await audit(page, '#timer-dialog');
    for (const key of Object.keys(report)) if (!report[key].length) delete report[key];
    expect(report).toEqual({});
  });

  test('first-run welcome dialog', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#welcome-dialog')).toBeVisible();
    expect(await audit(page, '#welcome-dialog')).toEqual([]);
  });

  for (const path of ['/physics-intelligence/', '/study-tracker/', '/community-share.html']) {
    test(`companion page ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await audit(page)).toEqual([]);
    });
  }
});
