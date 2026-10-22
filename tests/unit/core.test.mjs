import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { loadCore, plain } from './load-core.mjs';

const core = loadCore();
let seq = 0;
const ids = () => `t-${++seq}`;

const attempt = (overrides = {}) => core.sanitizeAttempt({
  id: ids(), date: '2026-10-01', subject: 'physics', topicKey: 'physics|1|5', type: 'topic-question',
  question: 'Q', earned: 4, total: 10, minutes: 20, confidence: 'medium', error: 'C', guesses: 0,
  createdAt: '2026-10-01T09:00:00.000Z', ...overrides,
});

describe('dates', () => {
  test('addDays crosses month and year boundaries without drift', () => {
    assert.equal(core.addDays('2026-12-30', 3), '2027-01-02');
    assert.equal(core.addDays('2028-02-28', 1), '2028-02-29');
    assert.equal(core.addDays('2026-03-01', -1), '2026-02-28');
  });

  test('dateDiffDays is symmetric and whole-day', () => {
    assert.equal(core.dateDiffDays('2026-10-01', '2026-10-08'), 7);
    assert.equal(core.dateDiffDays('2026-10-08', '2026-10-01'), -7);
  });

  test('zonedToday uses the student time zone, not UTC', () => {
    // 20:00 UTC on 31 Dec is already 1 Jan in Colombo (UTC+05:30).
    const now = new Date('2026-12-31T20:00:00Z');
    assert.equal(core.zonedToday('Asia/Colombo', now), '2027-01-01');
    assert.equal(core.zonedToday('UTC', now), '2026-12-31');
  });

  test('isISODate rejects impossible dates and non-strings', () => {
    assert.equal(core.isISODate('2026-02-29'), false);
    assert.equal(core.isISODate('2028-02-29'), true);
    assert.equal(core.isISODate('2026-1-01'), false);
    assert.equal(core.isISODate(20261001), false);
  });
});

describe('evidence rules', () => {
  test('a clean pass needs full raw marks, full trusted marks, no guesses and no error', () => {
    assert.equal(core.isFullPass({ earned: 5, total: 5, guesses: 0, error: '' }), true);
    assert.equal(core.isFullPass({ earned: 5, total: 5, trustedEarned: 4, guesses: 0, error: '' }), false);
    assert.equal(core.isFullPass({ earned: 5, total: 5, guesses: 1, error: '' }), false);
    assert.equal(core.isFullPass({ earned: 5, total: 5, guesses: 0, error: 'G' }), false);
    assert.equal(core.isFullPass(null), false);
  });

  test('verification attempts never open a new chain', () => {
    assert.equal(core.needsRetest(attempt({ type: 'fresh-transfer' })), false);
    assert.equal(core.needsRetest(attempt({ earned: 10, error: '' })), false);
    assert.equal(core.needsRetest(attempt({ earned: 10, error: '', guesses: 2 })), true);
  });

  test('repair priority weights recurrence and confidence traps above raw volume', () => {
    const noisy = core.repairPriorityScore({ lost: 4 });
    const recurring = core.repairPriorityScore({ lost: 2, errorAttempts: 3, highConfidence: 1 });
    assert.ok(recurring > noisy);
    assert.equal(core.repairPriorityScore({}), 0);
  });
});

describe('retest lifecycle', () => {
  test('a lost-mark attempt schedules transfer and delayed checks on the configured intervals', () => {
    const a = attempt();
    const [first, second] = core.createRetests(a, [2, 9], ids);
    assert.deepEqual([first.stage, first.due], [1, '2026-10-03']);
    assert.deepEqual([second.stage, second.due], [2, '2026-10-10']);
    assert.equal(first.sourceAttemptId, a.id);
  });

  test('invalid intervals fall back to the 3/7-day default', () => {
    const [first, second] = core.createRetests(attempt(), ['x', -1], ids);
    assert.deepEqual([first.due, second.due], ['2026-10-04', '2026-10-08']);
  });

  test('a passing transfer closes only its own stage', () => {
    const source = attempt();
    const retests = core.createRetests(source, [3, 7], ids);
    const transfer = attempt({ type: 'fresh-transfer', date: '2026-10-09', earned: 10, error: '' });
    const closed = core.applyRetestOutcome(retests, transfer);
    assert.equal(closed.stage, 1);
    assert.equal(closed.completedAt, '2026-10-09');
    assert.equal(retests[1].completedAt, null);
  });

  test('a check is never closed before it is due', () => {
    const retests = core.createRetests(attempt(), [3, 7], ids);
    const early = attempt({ type: 'fresh-transfer', date: '2026-10-02', earned: 10, error: '' });
    assert.equal(core.applyRetestOutcome(retests, early), null);
  });

  test('ambiguous matches are left alone unless the student chose a specific check', () => {
    const retests = [
      ...core.createRetests(attempt({ id: 'a' }), [3, 7], ids),
      ...core.createRetests(attempt({ id: 'b', date: '2026-10-02' }), [3, 7], ids),
    ];
    const transfer = attempt({ type: 'fresh-transfer', date: '2026-10-20', earned: 10, error: '' });
    assert.equal(core.applyRetestOutcome(retests, transfer), null);
    const chosen = retests.find(r => r.sourceAttemptId === 'b' && r.stage === 1);
    const closed = core.applyRetestOutcome(retests, { ...transfer, retestId: chosen.id });
    assert.equal(closed.id, chosen.id);
  });

  test('a failed check stays open and counts the failure', () => {
    const retests = core.createRetests(attempt(), [3, 7], ids);
    const fail = attempt({ type: 'fresh-transfer', date: '2026-10-05', earned: 7, error: 'M' });
    const r = core.applyRetestOutcome(retests, fail);
    assert.deepEqual([r.completedAt, r.status, r.failures], [null, 'failed-open', 1]);
  });

  test('deleting the evidence that closed a check reopens it', () => {
    const source = attempt({ id: 'src' });
    const state = { attempts: [source], retests: core.createRetests(source, [3, 7], ids), repairEvents: [{ sourceAttemptId: 'src' }] };
    const pass = attempt({ id: 'pass', type: 'fresh-transfer', date: '2026-10-05', earned: 10, error: '' });
    core.applyRetestOutcome(state.retests, pass);
    state.attempts.push(pass);
    const result = core.deleteAttempt(state, 'pass');
    assert.equal(result.reopened, 1);
    const stage1 = state.retests.find(r => r.stage === 1);
    assert.equal(stage1.completedAt, null);
    assert.deepEqual(plain(stage1.attempts), []);
  });

  test('deleting a source attempt removes its checks and repair events', () => {
    const source = attempt({ id: 'src' });
    const state = { attempts: [source], retests: core.createRetests(source, [3, 7], ids), repairEvents: [{ sourceAttemptId: 'src' }] };
    const result = core.deleteAttempt(state, 'src');
    assert.equal(result.removedRetests, 2);
    assert.equal(state.retests.length, 0);
    assert.equal(state.repairEvents.length, 0);
  });

  test('editing a full-credit attempt down to lost marks schedules its checks', () => {
    const a = attempt({ earned: 10, error: '' });
    const state = { attempts: [a], retests: [] };
    const edited = { ...a, earned: 6, error: 'R' };
    state.attempts[0] = edited;
    core.reconcileEditedAttempt(state, edited, [3, 7], ids);
    assert.deepEqual(state.retests.map(r => r.stage), [1, 2]);
  });

  test('editing a source to full credit removes only untouched checks', () => {
    const a = attempt();
    const state = { attempts: [a], retests: core.createRetests(a, [3, 7], ids) };
    state.retests[1].attempts = [{ attemptId: 'other', date: '2026-10-09', passed: false }];
    const edited = { ...a, earned: 10, error: '' };
    core.reconcileEditedAttempt(state, edited, [3, 7], ids);
    assert.deepEqual(plain(state.retests.map(r => r.stage)), [2]);
  });

  test('untouched checks follow a corrected date and topic', () => {
    const a = attempt();
    const state = { attempts: [a], retests: core.createRetests(a, [3, 7], ids) };
    const edited = { ...a, date: '2026-10-10', topicKey: 'physics|2|0' };
    core.reconcileEditedAttempt(state, edited, [3, 7], ids);
    assert.deepEqual(plain(state.retests.map(r => [r.due, r.topicKey])), [['2026-10-13', 'physics|2|0'], ['2026-10-17', 'physics|2|0']]);
  });

  test('correcting a verification attempt re-evaluates the check it closed', () => {
    const source = attempt();
    const state = { attempts: [source], retests: core.createRetests(source, [3, 7], ids) };
    const pass = attempt({ id: 'v', type: 'fresh-transfer', date: '2026-10-05', earned: 10, error: '' });
    core.applyRetestOutcome(state.retests, pass);
    state.attempts.push(pass);
    const corrected = { ...pass, earned: 8, error: 'A' };
    state.attempts[1] = corrected;
    core.reconcileEditedAttempt(state, corrected, [3, 7], ids);
    const stage1 = state.retests.find(r => r.stage === 1);
    assert.deepEqual([stage1.completedAt, stage1.status, stage1.failures], [null, 'failed-open', 1]);
  });
});

describe('sanitisation', () => {
  const hostile = '<img src=x onerror=alert(1)>';

  test('hostile identifiers and enums are replaced, never passed through', () => {
    const a = core.sanitizeAttempt({ id: `x" onclick="evil`, date: '2026-10-01', subject: 'physics', topicKey: 'physics|0|0', earned: 1, total: 2, error: hostile, confidence: hostile, type: hostile, retestId: hostile }, () => 'safe-id');
    assert.equal(a.id, 'safe-id');
    assert.equal(a.error, '');
    assert.equal(a.confidence, 'medium');
    assert.equal(a.type, 'topic-question');
    assert.equal(a.retestId, null);
  });

  test('records that cannot be placed are dropped', () => {
    assert.equal(core.sanitizeAttempt({ subject: hostile, topicKey: hostile, date: '2026-10-01', total: 5 }), null);
    assert.equal(core.sanitizeAttempt({ subject: 'physics', topicKey: 'biology|0|0', date: '2026-10-01', total: 5 }), null);
    assert.equal(core.sanitizeAttempt({ subject: 'physics', date: 'yesterday', total: 5 }), null);
    assert.equal(core.sanitizeAttempt({ subject: 'physics', date: '2026-10-01', total: 0 }), null);
    assert.equal(core.sanitizeRetest({ topicKey: 'physics|0|0', due: hostile, stage: 1 }), null);
  });

  test('marks are clamped to a coherent range', () => {
    const a = core.sanitizeAttempt({ subject: 'chemistry', date: '2026-10-01', earned: 99, total: 10, trustedEarned: 50, guesses: -3, minutes: 'abc' });
    assert.deepEqual([a.earned, a.trustedEarned, a.guesses, a.minutes], [10, 10, 0, 0]);
  });

  test('unknown primitive fields from newer builds survive; objects and functions do not', () => {
    const a = core.sanitizeAttempt({ subject: 'biology', date: '2026-10-01', total: 1, paperCode: 'P01', nested: { a: 1 }, 'bad key': 1 });
    assert.equal(a.paperCode, 'P01');
    assert.equal('nested' in a, false);
    assert.equal('bad key' in a, false);
  });

  test('escapeHTML neutralises markup', () => {
    assert.equal(core.escapeHTML(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});

describe('state normalisation and import', () => {
  test('an empty record becomes a complete default state', () => {
    const { state } = core.normalizeState({});
    assert.equal(state.schemaVersion, core.SCHEMA_VERSION);
    assert.equal(state.buildVersion, core.BUILD);
    assert.deepEqual(plain(state.v5Settings.retestIntervals), [3, 7]);
    assert.deepEqual(plain(state.attempts), []);
  });

  test('legacy V2 ratings seed a brand-new record', () => {
    const { state } = core.normalizeState(null, { legacyRatings: { 'physics|0|0': 2, 'nope': 3 } });
    assert.deepEqual(plain(state.ratings), { 'physics|0|0': 2 });
  });

  test('the retired V6 daily quotas are reset to "no target"', () => {
    const { state } = core.normalizeState({ dailyTargets: plain(core.OLD_V6_DAILY_TARGETS) });
    assert.equal(state.dailyTargets.physics.mcqs, 0);
    const custom = core.normalizeState({ dailyTargets: { physics: { mcqs: 15 } } }).state;
    assert.equal(custom.dailyTargets.physics.mcqs, 15);
  });

  test('invalid records are counted in the report', () => {
    const { state, report } = core.normalizeState({ attempts: [{ subject: 'physics', date: '2026-10-01', total: 1 }, { nope: true }], retests: ['x'] });
    assert.equal(state.attempts.length, 1);
    assert.deepEqual(plain(report.dropped), { attempts: 1, retests: 1 });
  });

  test('duplicate ids are made unique', () => {
    const { state } = core.normalizeState({ attempts: [{ id: 'dup', subject: 'physics', date: '2026-10-01', total: 1 }, { id: 'dup', subject: 'physics', date: '2026-10-02', total: 1 }] });
    assert.notEqual(state.attempts[0].id, state.attempts[1].id);
  });

  test('inspectImport recognises unified backups, core backups, legacy ratings and junk', () => {
    const core0 = { attempts: [], ratings: {} };
    assert.equal(core.inspectImport({ product: 'A/L Performance Powerhouse', core: core0, study_tracker: { sessions: [] } }).kind, 'backup');
    assert.equal(core.inspectImport(core0).kind, 'backup');
    assert.equal(core.inspectImport({ 'biology|0|1': 3 }).kind, 'legacy-ratings');
    assert.equal(core.inspectImport({ product: 'A/L Performance Powerhouse' }).kind, 'invalid');
    assert.equal(core.inspectImport('string').kind, 'invalid');
    assert.equal(core.inspectImport({ dailyProgress: [] }).kind, 'other');
  });

  test('inspectImport summarises what will be restored before anything is written', () => {
    const plan = core.inspectImport({ attempts: [{ subject: 'physics', date: '2026-10-01', total: 1 }, { bad: 1 }], ratings: {} });
    assert.equal(plan.dropped, 1);
    assert.match(plan.summary, /1 attempt\(s\)/);
    assert.match(plan.summary, /1 invalid record/);
  });
});

describe('demo dataset', () => {
  test('is deterministic, fictional and fully valid', () => {
    const a = core.buildDemoState('2026-10-21');
    const b = core.buildDemoState('2026-10-21');
    assert.deepEqual(plain(a), plain(b));
    assert.equal(a.profile.name, 'Demo Student');
    assert.ok(a.attempts.length >= 10);
    const { report } = core.normalizeState(plain(a));
    assert.deepEqual(plain(report.dropped), {});
  });

  test('contains closed, failed and overdue evidence so every panel has content', () => {
    const demo = core.buildDemoState('2026-10-21');
    assert.ok(demo.retests.some(r => r.status === 'passed'));
    assert.ok(demo.retests.some(r => r.status === 'failed-open'));
    assert.ok(demo.retests.some(r => !r.completedAt && r.due < '2026-10-21'));
    assert.ok(demo.repairEvents.length > 0);
  });
});
