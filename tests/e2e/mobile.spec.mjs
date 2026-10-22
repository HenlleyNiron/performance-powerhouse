import { test, expect } from '@playwright/test';
import { acceptDialogs, seedState, trackErrors } from './helpers.mjs';

test('core panels do not overflow horizontally on a phone', async ({ page }) => {
  const errors = trackErrors(page);
  acceptDialogs(page);
  await seedState(page);
  await page.goto('/');
  for (const panel of ['command', 'physics', 'repairs', 'daily', 'attempts', 'guide']) {
    await page.evaluate(p => window.navigate(p), panel);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `panel ${panel} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});

test('the floating quick-log control opens the attempt dialog', async ({ page }) => {
  await seedState(page);
  await page.goto('/');
  await page.locator('#mobile-quick-log').click();
  await expect(page.locator('#attempt-dialog')).toBeVisible();
});
