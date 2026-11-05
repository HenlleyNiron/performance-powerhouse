import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { loadCore, plain } from './load-core.mjs';

const core = loadCore();
let seq = 0;
const ids = () => `t-${++seq}`;

const attempt = (overrides = {}) =>
  core.sanitizeAttempt({
    id: ids(),
    date: '2026-10-01',
    subject: 'physics',
    topicKey: 'physics|1|5',
    type: 'topic-question',
    question: 'Q',
    earned: 4,
    total: 10,
    minutes: 20,
    confidence: 'medium',
    error: 'C',
    guesses: 0,
    createdAt: '2026-10-01T09:00:00.000Z',
    ...overrides,
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
    const state = {
      attempts: [source],
      retests: core.createRetests(source, [3, 7], ids),
      repairEvents: [{ sourceAttemptId: 'src' }],
    };
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
    const state = {
      attempts: [source],
      retests: core.createRetests(source, [3, 7], ids),
      repairEvents: [{ sourceAttemptId: 'src' }],
    };
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
    assert.deepEqual(
      state.retests.map(r => r.stage),
      [1, 2],
    );
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
    assert.deepEqual(plain(state.retests.map(r => [r.due, r.topicKey])), [
      ['2026-10-13', 'physics|2|0'],
      ['2026-10-17', 'physics|2|0'],
    ]);
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

  // A logged transfer pass that closed stage 1, ready for a correction.
  const closedTransfer = (passOverrides = {}) => {
    const source = attempt();
    const state = { attempts: [source], retests: core.createRetests(source, [3, 7], ids) };
    const pass = attempt({
      type: 'fresh-transfer',
      date: '2026-10-05',
      earned: 10,
      error: '',
      ...passOverrides,
    });
    core.applyRetestOutcome(state.retests, pass);
    state.attempts.push(pass);
    const correct = changes => {
      const corrected = { ...pass, ...changes };
      state.attempts[1] = corrected;
      core.reconcileEditedAttempt(state, corrected, [3, 7], ids);
      return corrected;
    };
    return { state, pass, correct, stage: n => state.retests.find(r => r.stage === n) };
  };

  test('moving a verification pass to another topic reopens the check it no longer verifies', () => {
    const { pass, correct, stage } = closedTransfer();
    assert.equal(stage(1).completedAt, '2026-10-05');
    correct({ topicKey: 'physics|2|0' });
    assert.deepEqual(plain([stage(1).completedAt, stage(1).attempts, stage(1).failures]), [null, [], 0]);
    assert.equal(stage(1).status, undefined);
    assert.notEqual(stage(1).lastAttemptId, pass.id);
  });

  test('re-dating a verification pass to before the due date reopens the check', () => {
    const { correct, stage } = closedTransfer();
    correct({ date: '2026-10-02' }); // stage 1 was due 2026-10-04
    assert.equal(stage(1).completedAt, null);
    assert.equal(stage(1).attempts.length, 0);
  });

  test('retyping a verification pass moves its evidence to the stage it now matches', () => {
    const { correct, stage } = closedTransfer({ date: '2026-10-09' });
    assert.equal(stage(1).completedAt, '2026-10-09');
    correct({ type: 'delayed-retest' });
    assert.equal(stage(1).completedAt, null);
    assert.equal(stage(2).completedAt, '2026-10-09');
  });

  test('retyping a verification pass to a source type reopens its check and schedules its own', () => {
    const { pass, state, correct, stage } = closedTransfer();
    correct({ type: 'topic-question', earned: 6, error: 'M' });
    assert.equal(stage(1).completedAt, null);
    assert.equal(state.retests.filter(r => r.sourceAttemptId === pass.id).length, 2);
  });

  test('a verification attempt corrected onto its due date closes that check', () => {
    const source = attempt();
    const state = { attempts: [source], retests: core.createRetests(source, [3, 7], ids) };
    const early = attempt({ type: 'fresh-transfer', date: '2026-10-02', earned: 10, error: '' });
    assert.equal(core.applyRetestOutcome(state.retests, early), null);
    state.attempts.push(early);
    const fixed = { ...early, date: '2026-10-04' };
    state.attempts[1] = fixed;
    core.reconcileEditedAttempt(state, fixed, [3, 7], ids);
    const stage1 = state.retests.find(r => r.stage === 1);
    assert.deepEqual(plain(stage1.attempts), [{ attemptId: early.id, date: '2026-10-04', passed: true }]);
  });

  test('a corrected attempt with a stale launch link falls back to the unambiguous check', () => {
    const { state, correct } = closedTransfer();
    const other = attempt({ topicKey: 'physics|2|0' });
    state.attempts.push(other);
    state.retests.push(...core.createRetests(other, [3, 7], ids));
    const launched = state.retests.find(r => r.stage === 1 && r.topicKey === 'physics|1|5');
    state.attempts[1].retestId = launched.id;
    correct({ topicKey: 'physics|2|0', retestId: launched.id });
    const moved = state.retests.find(r => r.stage === 1 && r.topicKey === 'physics|2|0');
    assert.equal(launched.completedAt, null);
    assert.equal(moved.completedAt, '2026-10-05');
  });

  test('an attempt without a date never verifies a check', () => {
    const source = attempt();
    const retests = core.createRetests(source, [3, 7], ids);
    const undated = { ...attempt({ type: 'fresh-transfer', earned: 10, error: '' }), date: undefined };
    assert.equal(core.applyRetestOutcome(retests, undated), null);
  });

  test('a corrected attempt still verifying its check stays linked to exactly one check', () => {
    const { pass, state, correct } = closedTransfer();
    correct({ note: 'clarified working', minutes: 25 });
    const linked = state.retests.filter(r => r.attempts.some(e => e.attemptId === pass.id));
    assert.equal(linked.length, 1);
    assert.equal(linked[0].completedAt, '2026-10-05');
  });
});

describe('sanitisation', () => {
  const hostile = '<img src=x onerror=alert(1)>';

  test('hostile identifiers and enums are replaced, never passed through', () => {
    const a = core.sanitizeAttempt(
      {
        id: `x" onclick="evil`,
        date: '2026-10-01',
        subject: 'physics',
        topicKey: 'physics|0|0',
        earned: 1,
        total: 2,
        error: hostile,
        confidence: hostile,
        type: hostile,
        retestId: hostile,
      },
      () => 'safe-id',
    );
    assert.equal(a.id, 'safe-id');
    assert.equal(a.error, '');
    assert.equal(a.confidence, 'medium');
    assert.equal(a.type, 'topic-question');
    assert.equal(a.retestId, null);
  });

  test('records that cannot be placed are dropped', () => {
    assert.equal(
      core.sanitizeAttempt({ subject: hostile, topicKey: hostile, date: '2026-10-01', total: 5 }),
      null,
    );
    assert.equal(
      core.sanitizeAttempt({ subject: 'physics', topicKey: 'biology|0|0', date: '2026-10-01', total: 5 }),
      null,
    );
    assert.equal(core.sanitizeAttempt({ subject: 'physics', date: 'yesterday', total: 5 }), null);
    assert.equal(core.sanitizeAttempt({ subject: 'physics', date: '2026-10-01', total: 0 }), null);
    assert.equal(core.sanitizeRetest({ topicKey: 'physics|0|0', due: hostile, stage: 1 }), null);
  });

  test('marks are clamped to a coherent range', () => {
    const a = core.sanitizeAttempt({
      subject: 'chemistry',
      date: '2026-10-01',
      earned: 99,
      total: 10,
      trustedEarned: 50,
      guesses: -3,
      minutes: 'abc',
    });
    assert.deepEqual([a.earned, a.trustedEarned, a.guesses, a.minutes], [10, 10, 0, 0]);
  });

  test('unknown primitive fields from newer builds survive; objects and functions do not', () => {
    const a = core.sanitizeAttempt({
      subject: 'biology',
      date: '2026-10-01',
      total: 1,
      paperCode: 'P01',
      nested: { a: 1 },
      'bad key': 1,
    });
    assert.equal(a.paperCode, 'P01');
    assert.equal('nested' in a, false);
    assert.equal('bad key' in a, false);
  });

  test('escapeHTML neutralises markup', () => {
    assert.equal(
      core.escapeHTML(`<a href="x">'&'</a>`),
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
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
    const { state } = core.normalizeState(null, { legacyRatings: { 'physics|0|0': 2, nope: 3 } });
    assert.deepEqual(plain(state.ratings), { 'physics|0|0': 2 });
  });

  test('the retired V6 daily quotas are reset to "no target"', () => {
    const { state } = core.normalizeState({ dailyTargets: plain(core.OLD_V6_DAILY_TARGETS) });
    assert.equal(state.dailyTargets.physics.mcqs, 0);
    const custom = core.normalizeState({ dailyTargets: { physics: { mcqs: 15 } } }).state;
    assert.equal(custom.dailyTargets.physics.mcqs, 15);
  });

  test('invalid records are counted in the report', () => {
    const { state, report } = core.normalizeState({
      attempts: [{ subject: 'physics', date: '2026-10-01', total: 1 }, { nope: true }],
      retests: ['x'],
    });
    assert.equal(state.attempts.length, 1);
    assert.deepEqual(plain(report.dropped), { attempts: 1, retests: 1 });
  });

  test('duplicate ids are made unique', () => {
    const { state } = core.normalizeState({
      attempts: [
        { id: 'dup', subject: 'physics', date: '2026-10-01', total: 1 },
        { id: 'dup', subject: 'physics', date: '2026-10-02', total: 1 },
      ],
    });
    assert.notEqual(state.attempts[0].id, state.attempts[1].id);
  });

  test('inspectImport recognises unified backups, core backups, legacy ratings and junk', () => {
    const core0 = { attempts: [], ratings: {} };
    assert.equal(
      core.inspectImport({
        product: 'A/L Performance Powerhouse',
        core: core0,
        study_tracker: { sessions: [] },
      }).kind,
      'backup',
    );
    assert.equal(core.inspectImport(core0).kind, 'backup');
    assert.equal(core.inspectImport({ 'biology|0|1': 3 }).kind, 'legacy-ratings');
    assert.equal(core.inspectImport({ product: 'A/L Performance Powerhouse' }).kind, 'invalid');
    assert.equal(core.inspectImport('string').kind, 'invalid');
    assert.equal(core.inspectImport({ dailyProgress: [] }).kind, 'other');
  });

  test('inspectImport summarises what will be restored before anything is written', () => {
    const plan = core.inspectImport({
      attempts: [{ subject: 'physics', date: '2026-10-01', total: 1 }, { bad: 1 }],
      ratings: {},
    });
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

describe('edge cases', () => {
  test('zonedToday falls back to UTC for an unknown time zone', () => {
    const now = new Date('2026-12-31T20:00:00Z');
    assert.equal(core.zonedToday('Not/AZone', now), '2026-12-31');
  });

  test('a passing attempt that is later re-evaluated still closes the check', () => {
    const source = attempt();
    const state = { attempts: [source], retests: core.createRetests(source, [3, 7], ids) };
    const fail = attempt({ id: 'f', type: 'fresh-transfer', date: '2026-10-05', earned: 6, error: 'M' });
    const pass = attempt({ id: 'p', type: 'fresh-transfer', date: '2026-10-08', earned: 10, error: '' });
    core.applyRetestOutcome(state.retests, fail);
    core.applyRetestOutcome(state.retests, pass);
    state.attempts.push(fail, pass);
    const stage1 = state.retests.find(r => r.stage === 1);
    core.recomputeRetest(stage1, new Map(state.attempts.map(a => [a.id, a])));
    assert.deepEqual(
      [stage1.completedAt, stage1.status, stage1.failures, stage1.lastAttemptId],
      ['2026-10-08', 'passed', 1, 'p'],
    );
  });

  test('course-correction events keep only safe, dated records', () => {
    const { state } = core.normalizeState({
      courseCorrection: {
        disciplineMode: false,
        targetDate: '2027-08-01',
        rabbitHoleEvents: [
          { id: 'e1', type: 'resource', date: '2026-10-01', at: '2026-10-01T10:00:00Z' },
          { type: '<b>', date: 'nope' },
          'junk',
        ],
        dailyAudits: { '2026-10-01': { sleepProtected: true, 'bad key': true }, notadate: {} },
      },
    });
    const cc = state.courseCorrection;
    assert.equal(cc.disciplineMode, false);
    assert.equal(cc.targetDate, '2027-08-01');
    assert.deepEqual(plain(cc.rabbitHoleEvents), [
      { id: 'e1', date: '2026-10-01', at: '2026-10-01T10:00:00Z', type: 'resource' },
    ]);
    assert.deepEqual(plain(cc.dailyAudits), { '2026-10-01': { sleepProtected: true } });
  });

  test('lostMarksByError totals lost marks per error family', () => {
    const totals = core.lostMarksByError([
      { error: 'C', earned: 4, total: 10 },
      { error: 'C', earned: 9, total: 10 },
      { error: '', earned: 0, total: 5 },
      { error: 'X', earned: 0, total: 5 },
    ]);
    assert.equal(totals.C, 7);
    assert.equal(totals.K, 0);
    assert.equal('X' in totals, false);
  });

  test('makeId produces distinct safe identifiers', () => {
    const a = core.makeId();
    const b = core.makeId();
    assert.notEqual(a, b);
    assert.match(a, /^[A-Za-z0-9._:-]+$/);
  });
});

describe('repair intelligence', () => {
  const today = '2026-10-21';
  const a = (overrides = {}) =>
    core.sanitizeAttempt({
      id: ids(),
      date: '2026-10-15',
      subject: 'physics',
      topicKey: 'physics|1|5',
      earned: 4,
      total: 10,
      error: 'C',
      confidence: 'medium',
      ...overrides,
    });

  test('ranks topics by repairPriorityScore and reports the dominant error family', () => {
    const state = {
      attempts: [
        a({ topicKey: 'physics|1|5', earned: 4, error: 'C', confidence: 'high' }),
        a({ topicKey: 'physics|1|5', earned: 7, error: 'C' }),
        a({ topicKey: 'biology|0|0', subject: 'biology', earned: 9, error: 'P' }),
        a({ topicKey: 'chemistry|0|0', subject: 'chemistry', earned: 10, error: '' }),
      ],
      retests: [],
    };
    const intel = core.repairIntelligence(state, today);
    assert.deepEqual(plain(intel.priorities.map(p => p.topicKey)), ['physics|1|5', 'biology|0|0']);
    const top = intel.priorities[0];
    // lost 9×3 + recurrence 1×5 + confidence trap 1×4 + recent 2
    assert.equal(top.score, 27 + 5 + 4 + 2);
    assert.equal(top.dominantError, 'C');
    assert.equal(intel.dominant, 'C');
    assert.equal(intel.recentLost, 10);
  });

  test('retest debt raises priority, and overdue debt counts double', () => {
    const src = a();
    const base = { attempts: [src], retests: [] };
    const withDebt = {
      attempts: [src],
      retests: [
        { topicKey: src.topicKey, due: '2026-10-01', completedAt: null },
        { topicKey: src.topicKey, due: '2026-12-01', completedAt: null },
        { topicKey: src.topicKey, due: '2026-10-01', completedAt: '2026-10-02' },
      ],
    };
    const before = core.repairIntelligence(base, today).priorities[0].score;
    const after = core.repairIntelligence(withDebt, today);
    assert.equal(after.priorities[0].due, 3);
    assert.equal(after.priorities[0].score - before, 12);
    assert.deepEqual([after.totalRetests, after.completedRetests], [3, 1]);
  });

  test('topicPriorities combines self-rating, evidence and due checks across all topics', () => {
    const topics = [{ key: 'physics|0|0' }, { key: 'physics|0|1' }, { key: 'physics|0|2' }];
    const state = {
      ratings: { 'physics|0|2': 1 },
      attempts: [a({ topicKey: 'physics|0|0', earned: 2, total: 10, error: 'K', confidence: 'high' })],
      retests: [{ topicKey: 'physics|0|0', due: '2026-10-20', completedAt: null }],
    };
    const ranked = core.topicPriorities(state, topics, today);
    assert.deepEqual(plain(ranked.map(t => t.key)), ['physics|0|0', 'physics|0|2']);
    // lost capped at 10 → 8, 1 error ×2, 1 confidence trap ×3, 1 due check ×5
    assert.equal(ranked[0].score, 8 + 2 + 3 + 5);
    assert.equal(ranked[0].accuracy, 20);
    assert.equal(ranked[1].score, 5);
  });

  test('stays fast for a year of heavy use', () => {
    const topics = Array.from({ length: 600 }, (_, i) => ({
      key: `physics|${Math.floor(i / 20)}|${i % 20}`,
    }));
    const attempts = Array.from({ length: 5000 }, (_, i) =>
      a({ topicKey: topics[i % topics.length].key, earned: i % 10, error: i % 10 === 10 ? '' : 'M' }),
    );
    const retests = attempts.map((x, i) => ({
      topicKey: x.topicKey,
      due: '2026-10-10',
      completedAt: i % 2 ? '2026-10-11' : null,
    }));
    const state = { ratings: {}, attempts, retests };
    const t0 = performance.now();
    core.repairIntelligence(state, today);
    core.topicPriorities(state, topics, today);
    assert.ok(performance.now() - t0 < 500, 'ranking 5,000 attempts should take well under a second');
  });
});

describe('evidence chains', () => {
  let n = 0;
  const mk = (overrides = {}) =>
    core.sanitizeAttempt({
      id: `c${++n}`,
      date: '2026-10-01',
      subject: 'biology',
      topicKey: 'biology|4|9',
      type: 'topic-question',
      earned: 10,
      total: 10,
      error: '',
      confidence: 'medium',
      createdAt: `2026-10-01T0${n % 10}:00:00.000Z`,
      ...overrides,
    });
  const source = (o = {}) => mk({ earned: 4, error: 'R', ...o });
  const lifecycle = state => core.evidenceModel(state).chains.map(c => c.lifecycle);

  test('a clean attempt opens no chain; lost marks, an error or a guess each do', () => {
    const state = {
      attempts: [mk(), mk({ earned: 9, error: '' }), mk({ error: 'A' }), mk({ guesses: 1 })],
      retests: [],
    };
    assert.equal(core.evidenceModel(state).chains.length, 3);
  });

  test('without repair: Open → Diagnosed → Repair planned', () => {
    assert.deepEqual(plain(lifecycle({ attempts: [source({ error: '' })], retests: [] })), ['Open']);
    assert.deepEqual(plain(lifecycle({ attempts: [source()], retests: [] })), ['Diagnosed']);
    assert.deepEqual(plain(lifecycle({ attempts: [source({ note: 'rule' })], retests: [] })), [
      'Repair planned',
    ]);
  });

  test('each stage must pass cleanly, in order, on or after the previous one', () => {
    const src = source();
    const repair = {
      id: 'rp',
      sourceAttemptId: src.id,
      completedAt: '2026-10-02',
      createdAt: null,
      rule: 'x',
    };
    const state = { attempts: [src], retests: [], repairEvents: [repair] };
    const now = () => plain(lifecycle(state));
    assert.deepEqual(now(), ['Reattempt due']);

    // A reattempt dated before the repair does not count.
    state.attempts.push(mk({ type: 'reattempt', date: '2026-10-01' }));
    assert.deepEqual(now(), ['Reattempt due']);

    state.attempts.push(mk({ type: 'reattempt', date: '2026-10-03' }));
    assert.deepEqual(now(), ['Fresh transfer due']);

    // A transfer dated before the reattempt does not count.
    state.attempts.push(mk({ type: 'fresh-transfer', date: '2026-10-02' }));
    assert.deepEqual(now(), ['Fresh transfer due']);

    state.attempts.push(mk({ type: 'fresh-transfer', date: '2026-10-05' }));
    assert.deepEqual(now(), ['Delayed retest due']);

    // A guessed delayed retest is not a clean pass.
    state.attempts.push(mk({ type: 'delayed-retest', date: '2026-10-09', guesses: 1 }));
    assert.deepEqual(now(), ['Delayed retest due']);

    state.attempts.push(mk({ type: 'delayed-retest', date: '2026-10-10' }));
    const [chain] = core.evidenceModel(state).chains;
    assert.equal(chain.lifecycle, 'Closed');
    assert.equal(chain.closedAt, '2026-10-10');
  });

  // Current (5.x) behaviour, pinned so any change is deliberate: a stage may be
  // skipped. A clean later stage dated after the repair counts without the earlier ones.
  test('a clean later stage after the repair can skip earlier stages', () => {
    const src = source();
    const repairEvents = [
      { id: 'rp', sourceAttemptId: src.id, completedAt: '2026-10-02', createdAt: null, rule: 'x' },
    ];
    const transferOnly = {
      attempts: [src, mk({ type: 'fresh-transfer', date: '2026-10-03' })],
      retests: [],
      repairEvents,
    };
    assert.deepEqual(plain(lifecycle(transferOnly)), ['Delayed retest due']);
    const delayedOnly = {
      attempts: [src, mk({ type: 'delayed-retest', date: '2026-10-09' })],
      retests: [],
      repairEvents,
    };
    assert.deepEqual(plain(lifecycle(delayedOnly)), ['Closed']);
  });

  test('a later failure on the same topic reopens a closed chain', () => {
    const src = source();
    const state = {
      attempts: [
        src,
        mk({ type: 'reattempt', date: '2026-10-02' }),
        mk({ type: 'fresh-transfer', date: '2026-10-04' }),
        mk({ type: 'delayed-retest', date: '2026-10-08' }),
      ],
      retests: [],
      repairEvents: [
        { id: 'rp', sourceAttemptId: src.id, completedAt: '2026-10-01', createdAt: null, rule: 'x' },
      ],
    };
    assert.equal(core.evidenceModel(state).chains.find(c => c.source.id === src.id).lifecycle, 'Closed');
    state.attempts.push(mk({ date: '2026-10-20', earned: 6, error: 'C' }));
    const reopened = core.evidenceModel(state).chains.find(c => c.source.id === src.id);
    assert.equal(reopened.lifecycle, 'Reopened');
    assert.equal(reopened.relapse.date, '2026-10-20');
  });

  test('chains needing action sort before closed ones', () => {
    const closedSrc = source({ date: '2026-09-01', topicKey: 'biology|0|0' });
    const state = {
      attempts: [
        closedSrc,
        mk({ type: 'reattempt', date: '2026-09-02', topicKey: 'biology|0|0' }),
        mk({ type: 'fresh-transfer', date: '2026-09-03', topicKey: 'biology|0|0' }),
        mk({ type: 'delayed-retest', date: '2026-09-09', topicKey: 'biology|0|0' }),
        source({ date: '2026-09-15', topicKey: 'biology|1|0' }),
      ],
      retests: [],
      repairEvents: [
        { id: 'rp', sourceAttemptId: closedSrc.id, completedAt: '2026-09-01', createdAt: null, rule: 'x' },
      ],
    };
    assert.deepEqual(plain(lifecycle(state)), ['Diagnosed', 'Closed']);
  });

  test('recovery measures repaired marks on the same scale only', () => {
    const src = source({ earned: 4, total: 10 });
    const state = {
      attempts: [
        src,
        mk({ type: 'reattempt', date: '2026-10-02', earned: 8, total: 10, error: 'M' }),
        mk({ type: 'fresh-transfer', date: '2026-10-03', earned: 20, total: 20 }),
      ],
      retests: [],
      repairEvents: [
        { id: 'rp', sourceAttemptId: src.id, completedAt: '2026-10-01', createdAt: null, rule: 'x' },
      ],
    };
    const r = core.evidenceModel(state).recovery();
    assert.equal(r.lost, 6);
    assert.equal(r.targeted, 6);
    assert.equal(r.recovered, 4); // 8/10 reattempt; the 20/20 transfer is a different scale
    assert.equal(r.repaired, 1);
    assert.equal(r.closureRate, 0);
  });

  test('calibration separates dangerous, fragile and secure answers', () => {
    const c = core.calibrationMetrics([
      mk({ confidence: 'high', earned: 5, error: 'C' }),
      mk({ confidence: 'low' }),
      mk({ confidence: 'high' }),
      mk({ confidence: 'medium', earned: 8, trustedEarned: 6, error: 'G', guesses: 2 }),
    ]);
    assert.deepEqual([c.danger, c.fragile, c.secure, c.guesses], [1, 1, 1, 2]);
    assert.equal(c.rawAccuracy, 83);
    assert.equal(c.trustedAccuracy, 60);
    assert.equal(c.gap, 23);
  });
});
