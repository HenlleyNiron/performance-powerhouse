import { expect } from '@playwright/test';

export const APP_KEY = 'al_performance_powerhouse_v5';
export const V4_KEY = 'al_performance_powerhouse_v4';
export const RECOVERY_KEY = 'al_performance_powerhouse_v5_recovery';

/** Today's date in Asia/Colombo, matching the application's own clock. */
export function colomboToday(offsetDays = 0) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date())
      .filter(p => p.type !== 'literal')
      .map(p => [p.type, p.value]),
  );
  const d = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Records uncaught page errors and console errors so every test can assert a clean run. */
export function trackErrors(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  return errors;
}

/** Accept every native confirm/prompt; prompts receive `promptAnswer`. */
export function acceptDialogs(page, promptAnswer = '') {
  page.on('dialog', dialog => dialog.accept(dialog.type() === 'prompt' ? promptAnswer : undefined));
}

/**
 * Seeds a completed profile (and optional extra state) once, before the first load.
 * Later reloads in the same test keep whatever the app itself saved.
 */
export async function seedState(page, extra = {}) {
  const seed = {
    profileSetupComplete: true,
    profile: { name: 'Test Student', year: '2027', target: '', line: '2027 A/L Bio Science · test' },
    ratings: {},
    attempts: [],
    retests: [],
    ...extra,
  };
  await page.addInitScript(([key, value]) => {
    if (!sessionStorage.getItem('__seeded')) {
      localStorage.setItem(key, value);
      sessionStorage.setItem('__seeded', '1');
    }
  }, [APP_KEY, JSON.stringify(seed)]);
}

export async function readState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), APP_KEY);
}

/** Opens the attempt dialog and fills a marked attempt. */
export async function logAttempt(page, { subject = 'physics', type = 'topic-question', topicIndex = 0, question = 'Test question', earned, total, minutes = 20, error = '', confidence = 'medium', guesses = 0, date } = {}) {
  await page.locator('#quick-log-btn').click();
  const dialog = page.locator('#attempt-dialog');
  await expect(dialog).toBeVisible();
  await page.selectOption('#attempt-subject', subject);
  await page.selectOption('#attempt-type', type);
  const topicValue = await page.locator('#attempt-topic option').nth(topicIndex).getAttribute('value');
  await page.selectOption('#attempt-topic', topicValue);
  if (date) await page.fill('#attempt-date', date);
  await page.fill('#attempt-question', question);
  await page.fill('#marks-earned', String(earned));
  await page.fill('#marks-total', String(total));
  await page.fill('#attempt-minutes', String(minutes));
  await page.fill('#attempt-guesses', String(guesses));
  await page.selectOption('#attempt-confidence', confidence);
  if (error) await page.selectOption('#attempt-error', error);
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toBeHidden();
  return topicValue;
}
