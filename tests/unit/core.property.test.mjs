// Property-based tests: instead of hand-picked examples, fast-check generates
// hundreds of random (and deliberately hostile) inputs and checks that rules
// which must ALWAYS hold really do. A fixed seed keeps CI reproducible; on
// failure fast-check prints the smallest counter-example it can find.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import fc from 'fast-check';
import { loadCore, plain } from './load-core.mjs';

const core = loadCore();
const RUNS = { numRuns: 500, seed: 20270215 };

const SAFE_ID = /^[A-Za-z0-9._:-]{1,100}$/;
const TOPIC_KEY = /^(physics|chemistry|biology)\|\d{1,3}\|\d{1,3}$/;
const HOSTILE = [
  '<img src=x onerror=alert(1)>',
  '"><script>x</script>',
  "' onmouseover='x",
  'javascript:x',
  '\u0000',
  '${7*7}',
];

// ------------------------------------------------------------ generators

const isoDate = fc
  .tuple(
    fc.integer({ min: 2025, max: 2028 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
const topicKey = fc
  .tuple(fc.constantFrom(...core.SUBJECTS), fc.integer({ min: 0, max: 3 }), fc.integer({ min: 0, max: 3 }))
  .map(([s, u, t]) => `${s}|${u}|${t}`);
const junk = fc.oneof(
  fc.constantFrom(...HOSTILE),
  fc.string(),
  fc.integer(),
  fc.double(),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
  fc.array(fc.string(), { maxLength: 3 }),
  fc.dictionary(fc.string({ maxLength: 8 }), fc.string({ maxLength: 8 }), { maxKeys: 3 }),
);
/** A field that is usually valid but sometimes hostile or the wrong type. */
const mostly = valid => fc.oneof({ weight: 4, arbitrary: valid }, { weight: 1, arbitrary: junk });

const rawAttempt = fc.record(
  {
    id: mostly(fc.stringMatching(/^[a-z0-9-]{1,12}$/)),
    date: mostly(isoDate),
    subject: mostly(fc.constantFrom(...core.SUBJECTS)),
    topicKey: mostly(topicKey),
    type: mostly(fc.constantFrom(...Object.keys(core.ATTEMPT_TYPE_NAMES))),
    question: mostly(fc.string({ maxLength: 40 })),
    earned: mostly(fc.integer({ min: -5, max: 60 })),
    total: mostly(fc.integer({ min: -5, max: 50 })),
    trustedEarned: mostly(fc.option(fc.integer({ min: -5, max: 60 }), { nil: null })),
    minutes: mostly(fc.integer({ min: -10, max: 5000 })),
    guesses: mostly(fc.integer({ min: -3, max: 30 })),
    confidence: mostly(fc.constantFrom(...core.CONFIDENCE_LEVELS)),
    error: mostly(fc.constantFrom('', ...Object.keys(core.ERROR_NAMES))),
    note: mostly(fc.string({ maxLength: 40 })),
    retestId: mostly(fc.option(fc.stringMatching(/^[a-z0-9-]{1,12}$/), { nil: null })),
  },
  { requiredKeys: [] },
);
const rawRetest = fc.record(
  {
    id: mostly(fc.stringMatching(/^[a-z0-9-]{1,12}$/)),
    sourceAttemptId: mostly(fc.stringMatching(/^[a-z0-9-]{1,12}$/)),
    topicKey: mostly(topicKey),
    due: mostly(isoDate),
    stage: mostly(fc.constantFrom(1, 2)),
    completedAt: mostly(fc.option(isoDate, { nil: null })),
    failures: mostly(fc.integer({ min: -2, max: 9 })),
    attempts: mostly(
      fc.array(fc.record({ attemptId: junk, date: mostly(isoDate), passed: junk }), { maxLength: 3 }),
    ),
    status: mostly(fc.constantFrom('passed', 'failed-open')),
  },
  { requiredKeys: [] },
);
const rawState = fc.record(
  {
    profile: mostly(fc.record({ name: junk, year: junk, target: junk, line: junk }, { requiredKeys: [] })),
    ratings: mostly(
      fc.dictionary(
        fc.oneof(topicKey, fc.string({ maxLength: 12 })),
        fc.oneof(fc.constantFrom(1, 2, 3), junk),
        {
          maxKeys: 5,
        },
      ),
    ),
    syllabusProgress: mostly(fc.dictionary(fc.string({ maxLength: 12 }), junk, { maxKeys: 5 })),
    attempts: mostly(fc.array(mostly(rawAttempt), { maxLength: 8 })),
    retests: mostly(fc.array(mostly(rawRetest), { maxLength: 6 })),
    repairEvents: mostly(fc.array(junk, { maxLength: 3 })),
    dailyEntries: mostly(fc.array(junk, { maxLength: 3 })),
    dailyTargets: junk,
    v5Settings: mostly(
      fc.record({ retestIntervals: junk, shareSafe: junk, searchScope: junk }, { requiredKeys: [] }),
    ),
    courseCorrection: junk,
    migration: junk,
    lastExportedAt: junk,
    legacyArchiveCount: junk,
  },
  { requiredKeys: [] },
);

/** A fully valid attempt, built through the sanitiser so it matches real records. */
const validAttempt = (types = Object.keys(core.ATTEMPT_TYPE_NAMES)) =>
  fc
    .record({
      date: isoDate,
      topicKey,
      type: fc.constantFrom(...types),
      total: fc.constantFrom(5, 10, 20),
      lostBy: fc.integer({ min: 0, max: 4 }),
      guesses: fc.constantFrom(0, 0, 0, 1),
      error: fc.constantFrom('', '', 'C', 'M', 'R'),
    })
    .map(a => ({ ...a, subject: a.topicKey.split('|')[0], earned: a.total - a.lostBy }));

// ---------------------------------------------------------------- properties

describe('property: normalizeState', () => {
  test('never throws, for any input at all', () => {
    fc.assert(
      fc.property(fc.oneof(junk, rawState, fc.anything()), raw => {
        core.normalizeState(raw);
      }),
      RUNS,
    );
  });

  test('is idempotent: normalising a normalised record changes nothing', () => {
    fc.assert(
      fc.property(rawState, raw => {
        const once = plain(core.normalizeState(raw).state);
        const again = core.normalizeState(plain(once));
        assert.deepEqual(plain(again.state), once);
        assert.deepEqual(plain(again.report.dropped), {});
      }),
      RUNS,
    );
  });

  test('every surviving record is well-formed and nothing hostile reaches ids or enums', () => {
    fc.assert(
      fc.property(rawState, raw => {
        const { state } = core.normalizeState(raw);
        const ids = new Set();
        for (const a of state.attempts) {
          assert.match(a.id, SAFE_ID);
          assert.ok(!ids.has(a.id), 'attempt ids are unique');
          ids.add(a.id);
          assert.ok(core.isISODate(a.date));
          assert.ok(core.SUBJECTS.includes(a.subject));
          assert.ok(
            a.topicKey === '' || (TOPIC_KEY.test(a.topicKey) && a.topicKey.startsWith(`${a.subject}|`)),
          );
          assert.ok(Object.hasOwn(core.ATTEMPT_TYPE_NAMES, a.type));
          assert.ok(a.error === '' || Object.hasOwn(core.ERROR_NAMES, a.error));
          assert.ok(core.CONFIDENCE_LEVELS.includes(a.confidence));
          assert.ok(Number.isFinite(a.total) && a.total > 0);
          assert.ok(Number.isFinite(a.earned) && a.earned >= 0 && a.earned <= a.total);
          assert.ok(a.trustedEarned === null || (a.trustedEarned >= 0 && a.trustedEarned <= a.earned));
          assert.ok(Number.isInteger(a.guesses) && a.guesses >= 0);
          assert.ok(a.retestId === null || SAFE_ID.test(a.retestId));
          assert.ok(a.question.length <= 200 && a.note.length <= 500);
        }
        for (const r of state.retests) {
          assert.match(r.id, SAFE_ID);
          assert.match(r.topicKey, TOPIC_KEY);
          assert.ok(core.isISODate(r.due));
          assert.ok(r.stage === 1 || r.stage === 2);
          assert.ok(r.completedAt === null || core.isISODate(r.completedAt));
          assert.ok(Number.isInteger(r.failures) && r.failures >= 0);
          for (const e of r.attempts) assert.ok(SAFE_ID.test(e.attemptId) && core.isISODate(e.date));
        }
        for (const [key, value] of Object.entries(state.ratings)) {
          assert.match(key, TOPIC_KEY);
          assert.ok([1, 2, 3].includes(value));
        }
        assert.equal(state.v5Settings.retestIntervals.length, 2);
        assert.ok(state.v5Settings.retestIntervals.every(n => Number.isFinite(n) && n >= 0 && n <= 365));
        assert.equal(typeof state.profile.name, 'string');
        assert.ok(state.profile.name.length <= 80);
      }),
      RUNS,
    );
  });
});

describe('property: inspectImport', () => {
  test('never throws and always classifies the file', () => {
    const backup = fc.record(
      {
        product: fc.constantFrom('A/L Performance Powerhouse', 'something else', undefined),
        core: mostly(rawState),
        study_tracker: junk,
        physics_intelligence: junk,
      },
      { requiredKeys: [] },
    );
    fc.assert(
      fc.property(fc.oneof(junk, rawState, backup, fc.anything()), parsed => {
        const plan = core.inspectImport(parsed);
        assert.ok(['backup', 'legacy-ratings', 'other', 'invalid'].includes(plan.kind));
        if (plan.kind === 'backup') {
          assert.equal(typeof plan.summary, 'string');
          assert.deepEqual(plain(core.normalizeState(plain(plan.state)).report.dropped), {});
        }
      }),
      RUNS,
    );
  });
});

describe('property: retest lifecycle', () => {
  // A random study history: attempts are logged in order, exactly as the app does it.
  const history = fc.array(validAttempt(), { minLength: 1, maxLength: 25 });

  function replay(rows) {
    let n = 0;
    const idFn = () => `id-${++n}`;
    const state = { attempts: [], retests: [], repairEvents: [] };
    const closedBy = [];
    for (const row of rows) {
      const attempt = core.sanitizeAttempt({ ...row, id: idFn() }, idFn);
      const before = new Set(state.retests.filter(r => r.completedAt).map(r => r.id));
      core.applyRetestOutcome(state.retests, attempt);
      state.attempts.push(attempt);
      state.retests.push(...core.createRetests(attempt, [3, 7], idFn));
      closedBy.push(state.retests.filter(r => r.completedAt && !before.has(r.id)).length);
    }
    return { state, closedBy };
  }

  function assertChecksConsistent(state) {
    const byId = new Map(state.attempts.map(a => [a.id, a]));
    for (const r of state.retests) {
      for (const e of r.attempts) assert.ok(byId.has(e.attemptId), 'a check never cites deleted evidence');
      if (!r.completedAt) continue;
      const proof = r.attempts.find(e => e.passed);
      assert.ok(proof, 'a closed check always has passing evidence');
      const a = byId.get(proof.attemptId);
      assert.ok(core.isFullPass(a), 'the evidence is a clean pass');
      assert.equal(a.topicKey, r.topicKey);
      assert.equal(a.type, r.stage === 1 ? 'fresh-transfer' : 'delayed-retest');
      assert.ok(a.date >= r.due, 'never closed before it was due');
      assert.equal(r.completedAt, a.date);
    }
  }

  test('one attempt closes at most one check, and closed checks always have clean, on-time evidence', () => {
    fc.assert(
      fc.property(history, rows => {
        const { state, closedBy } = replay(rows);
        assert.ok(closedBy.every(n => n <= 1));
        assertChecksConsistent(state);
        // Only attempts that lost marks, guessed or recorded an error open checks: two each.
        const sources = state.attempts.filter(a => core.needsRetest(a)).length;
        assert.equal(state.retests.length, sources * 2);
      }),
      RUNS,
    );
  });

  test('deleting any attempt never leaves a check closed without evidence', () => {
    fc.assert(
      fc.property(history, fc.nat(), (rows, pick) => {
        const { state } = replay(rows);
        const victim = state.attempts[pick % state.attempts.length];
        core.deleteAttempt(state, victim.id);
        assert.ok(!state.attempts.some(a => a.id === victim.id));
        assert.ok(!state.retests.some(r => r.sourceAttemptId === victim.id));
        assertChecksConsistent(state);
      }),
      RUNS,
    );
  });

  test('correcting any attempt keeps every check consistent with the corrected evidence', () => {
    fc.assert(
      fc.property(history, fc.nat(), validAttempt(), (rows, pick, correction) => {
        const { state } = replay(rows);
        let n = 1000;
        const index = pick % state.attempts.length;
        const edited = core.sanitizeAttempt({
          ...state.attempts[index],
          ...correction,
          id: state.attempts[index].id,
        });
        state.attempts[index] = edited;
        core.reconcileEditedAttempt(state, edited, [3, 7], () => `id-${++n}`);
        assertChecksConsistent(state);
        // The record still survives a save/load round trip untouched.
        assert.deepEqual(plain(core.normalizeState(plain(state)).report.dropped), {});
      }),
      RUNS,
    );
  });
});

describe('property: evidence chains', () => {
  test('a chain is Closed only with a clean delayed retest, and Reopened only after closure', () => {
    fc.assert(
      fc.property(fc.array(validAttempt(), { maxLength: 30 }), rows => {
        let n = 0;
        const attempts = rows.map(r => core.sanitizeAttempt({ ...r, id: `a${++n}` }));
        const { chains, recovery } = core.evidenceModel({ attempts, retests: [], repairEvents: [] });
        for (const c of chains) {
          assert.ok(Object.hasOwn(core.LIFECYCLE_RANK, c.lifecycle));
          for (const step of [c.reattempt, c.transfer, c.delayed]) {
            if (!step) continue;
            assert.ok(core.isFullPass(step));
            assert.equal(step.topicKey, c.source.topicKey);
            assert.ok(step.date >= c.source.date);
          }
          if (c.lifecycle === 'Closed') assert.ok(c.delayed && !c.relapse);
          if (c.lifecycle === 'Reopened') assert.ok(c.delayed && c.relapse && c.relapse.date > c.closedAt);
        }
        const r = recovery();
        assert.ok(r.recovered >= 0 && r.recovered <= r.targeted && r.targeted <= r.lost);
        assert.ok(r.closed <= chains.length);
      }),
      RUNS,
    );
  });
});
