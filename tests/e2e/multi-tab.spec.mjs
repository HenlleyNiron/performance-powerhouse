import { test, expect } from '@playwright/test';
import { logAttempt, readState, seedState, trackErrors } from './helpers.mjs';

// Students often leave the app open in more than one tab (phone + laptop browser
// restore, or a second tab opened from the study tracker). Each tab keeps the
// record in memory, so a save from a stale tab must never erase what another
// tab saved a moment earlier.
test('two open tabs never overwrite each other’s evidence', async ({ context }) => {
  const first = await context.newPage();
  const errors = trackErrors(first);
  await seedState(first);
  await first.goto('/');
  const second = await context.newPage();
  await second.goto('/');

  await logAttempt(first, { question: 'Logged in tab one', earned: 4, total: 10, error: 'C' });
  await logAttempt(second, { question: 'Logged in tab two', earned: 7, total: 10, error: 'M' });

  const questions = (await readState(second)).attempts.map(a => a.question).sort();
  expect(questions).toEqual(['Logged in tab one', 'Logged in tab two']);
  // The first tab shows the second tab's attempt without a reload.
  await first.locator('#app-tabs [data-panel="attempts"]').click();
  await expect(first.locator('#panel-attempts')).toContainText('Logged in tab two');
  expect(errors).toEqual([]);
});
