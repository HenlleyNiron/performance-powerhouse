// A small, entirely fictional record in which every evidence-chain lifecycle state
// appears exactly once, each on its own topic. Dates are fixed so the rendered
// text is identical on every machine when the clock is frozen at FROZEN_NOW.

/** Noon in Colombo on 15 February 2027. */
export const FROZEN_NOW = '2027-02-15T06:30:00.000Z';

const attempt = (id, date, topicKey, type, earned, extra = {}) => ({
  id,
  date,
  subject: topicKey.split('|')[0],
  topicKey,
  type,
  question: `Fixture ${id}`,
  earned,
  total: 10,
  trustedEarned: null,
  minutes: 15,
  items: 1,
  guesses: 0,
  confidence: 'medium',
  error: '',
  note: '',
  createdAt: `${date}T09:00:00.000Z`,
  ...extra,
});

const repair = (id, sourceAttemptId, completedAt) => ({
  id,
  sourceAttemptId,
  completedAt,
  createdAt: `${completedAt}T10:00:00.000Z`,
  rule: 'Fixture repair rule',
});

const retest = (id, sourceAttemptId, topicKey, due, stage) => ({
  id,
  sourceAttemptId,
  topicKey,
  due,
  stage,
  completedAt: null,
  failures: 0,
  attempts: [],
});

/** One source attempt per lifecycle state, plus the later evidence that puts it there. */
export function chainStatesRecord() {
  const T = {
    open: 'physics|0|0',
    diagnosed: 'physics|1|1',
    planned: 'physics|2|0',
    reattemptDue: 'chemistry|0|0',
    transferDue: 'chemistry|1|1',
    delayedDue: 'chemistry|2|0',
    closed: 'biology|0|0',
    reopened: 'biology|1|1',
  };
  const attempts = [
    // Open: marks lost, no error family recorded.
    attempt('open-src', '2027-02-10', T.open, 'topic-question', 6),
    // Diagnosed: error family recorded, no prevention rule.
    attempt('diag-src', '2027-02-09', T.diagnosed, 'mcq-set', 7, { error: 'C', confidence: 'high' }),
    // Repair planned: error family and a prevention rule.
    attempt('plan-src', '2027-02-08', T.planned, 'structured-essay', 5, { error: 'M', note: 'Fixture rule' }),
    // Reattempt due: repair logged, no clean reattempt yet.
    attempt('redo-src', '2027-02-05', T.reattemptDue, 'topic-question', 4, { error: 'K' }),
    // Fresh transfer due: repair and a clean reattempt.
    attempt('xfer-src', '2027-02-01', T.transferDue, 'topic-question', 6, { error: 'R' }),
    attempt('xfer-re', '2027-02-03', T.transferDue, 'reattempt', 10),
    // Delayed retest due: repair, reattempt and transfer all clean.
    attempt('late-src', '2027-01-20', T.delayedDue, 'mcq-set', 5, { error: 'A', guesses: 2 }),
    attempt('late-re', '2027-01-22', T.delayedDue, 'reattempt', 10),
    attempt('late-xf', '2027-01-25', T.delayedDue, 'fresh-transfer', 10),
    // Closed: the whole loop, cleanly.
    attempt('done-src', '2027-01-05', T.closed, 'topic-question', 3, { error: 'P', trustedEarned: 2 }),
    attempt('done-re', '2027-01-07', T.closed, 'reattempt', 10),
    attempt('done-xf', '2027-01-10', T.closed, 'fresh-transfer', 10),
    attempt('done-dl', '2027-01-16', T.closed, 'delayed-retest', 10),
    // Reopened: closed, then a later failure on the same topic.
    attempt('back-src', '2026-12-10', T.reopened, 'topic-question', 4, { error: 'T' }),
    attempt('back-re', '2026-12-12', T.reopened, 'reattempt', 10),
    attempt('back-xf', '2026-12-15', T.reopened, 'fresh-transfer', 10),
    attempt('back-dl', '2026-12-22', T.reopened, 'delayed-retest', 10),
    attempt('back-fail', '2027-02-12', T.reopened, 'full-paper', 6, { error: 'T', confidence: 'high' }),
  ];
  return {
    profileSetupComplete: true,
    profile: { name: 'Fixture Student', year: '2027', target: '', line: 'Fixture record · fictional data' },
    ratings: { [T.open]: 1, [T.closed]: 3, [T.diagnosed]: 2 },
    syllabusProgress: {},
    attempts,
    retests: [
      retest('rt-open-1', 'open-src', T.open, '2027-02-13', 1),
      retest('rt-open-2', 'open-src', T.open, '2027-02-17', 2),
      retest('rt-diag-1', 'diag-src', T.diagnosed, '2027-02-12', 1),
      retest('rt-diag-2', 'diag-src', T.diagnosed, '2027-02-16', 2),
      {
        ...retest('rt-done-1', 'done-src', T.closed, '2027-01-08', 1),
        completedAt: '2027-01-10',
        status: 'passed',
        attempts: [{ attemptId: 'done-xf', date: '2027-01-10', passed: true }],
      },
      {
        ...retest('rt-done-2', 'done-src', T.closed, '2027-01-12', 2),
        completedAt: '2027-01-16',
        status: 'passed',
        attempts: [{ attemptId: 'done-dl', date: '2027-01-16', passed: true }],
      },
    ],
    repairEvents: [
      repair('rp-redo', 'redo-src', '2027-02-06'),
      repair('rp-xfer', 'xfer-src', '2027-02-02'),
      repair('rp-late', 'late-src', '2027-01-21'),
      repair('rp-done', 'done-src', '2027-01-06'),
      repair('rp-back', 'back-src', '2026-12-11'),
    ],
    dailyEntries: [
      {
        id: 'day-1',
        date: '2027-02-14',
        timestamp: '2027-02-14T12:00:00.000Z',
        note: 'Fixture block',
        physics: { mcqs: 20, structured: 1, essays: 0, fullPapers: 0, retests: 0 },
        chemistry: { mcqs: 0, structured: 0, essays: 0, fullPapers: 0, retests: 1 },
        biology: { mcqs: 10, structured: 0, essays: 1, fullPapers: 0, retests: 0 },
      },
    ],
    lastExportedAt: '2027-02-13T08:00:00.000Z',
  };
}
