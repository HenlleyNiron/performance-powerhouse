import { test, expect } from '@playwright/test';
import { acceptDialogs, seedState } from './helpers.mjs';

// Students on shared computers and assistive technology rely on the keyboard.
// These checks cover what automated axe scans cannot: real keyboard operation.

test.describe('keyboard operation', () => {
  test.beforeEach(async ({ page }) => {
    acceptDialogs(page);
    await seedState(page);
    await page.goto('/');
  });

  test('section tabs activate with Enter', async ({ page }) => {
    await page.locator('#app-tabs [data-panel="repairs"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#panel-repairs')).toHaveClass(/active/);
  });

  test('syllabus units expand and collapse with Enter and Space', async ({ page }) => {
    await page.locator('#app-tabs [data-panel="physics"]').click();
    const header = page.locator('#panel-physics [data-unit-header]').first();
    await header.focus();
    await page.keyboard.press('Enter');
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press(' ');
    await expect(header).toHaveAttribute('aria-expanded', 'false');
  });

  test('the log dialog opens from the keyboard, holds focus, and Escape returns focus', async ({ page }) => {
    const opener = page.locator('#quick-log-btn');
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.locator('#attempt-dialog');
    await expect(dialog).toBeVisible();
    expect(
      await page.evaluate(() => document.getElementById('attempt-dialog').contains(document.activeElement)),
    ).toBe(true);
    // Tabbing through every field never leaves the modal dialog.
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const el = document.activeElement;
        return el === document.body || document.getElementById('attempt-dialog').contains(el);
      });
      expect(inside, `focus escaped the dialog after ${i + 1} Tab presses`).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('a complete attempt can be logged without a mouse', async ({ page }) => {
    await page.locator('#quick-log-btn').focus();
    await page.keyboard.press('Enter');
    await page.locator('#attempt-question').focus();
    await page.keyboard.type('Keyboard-only attempt');
    await page.locator('#marks-earned').focus();
    await page.keyboard.type('5');
    await page.locator('#marks-total').focus();
    await page.keyboard.type('5');
    await page.locator('#attempt-minutes').focus();
    await page.keyboard.type('12');
    await page.locator('#attempt-dialog button[type="submit"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#attempt-dialog')).toBeHidden();
    const count = await page.evaluate(
      () => JSON.parse(localStorage.getItem('al_performance_powerhouse_v5')).attempts.length,
    );
    expect(count).toBe(1);
  });

  test('keyboard focus is always visible', async ({ page }) => {
    await page.keyboard.press('Tab');
    const targets = ['#quick-log-btn', '#data-btn', '#app-tabs [data-panel="physics"]', '#start-focus-btn'];
    for (const selector of targets) {
      await page.locator(selector).focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      const style = await page.locator(selector).evaluate(el => {
        const s = getComputedStyle(el);
        return { outline: s.outlineStyle, width: parseFloat(s.outlineWidth), shadow: s.boxShadow };
      });
      const visible = (style.outline !== 'none' && style.width > 0) || style.shadow !== 'none';
      expect(visible, `${selector} has no visible focus indicator`).toBe(true);
    }
  });
});
