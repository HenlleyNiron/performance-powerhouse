/*
 * Performance Powerhouse — evidence core.
 *
 * Pure, DOM-free logic shared by the browser app and the Node test suite:
 *   - constants that define the evidence model (subjects, attempt types, error families)
 *   - date helpers pinned to the student's time zone
 *   - the retest lifecycle (schedule → attempt → pass/fail → reopen on deletion/edit)
 *   - validation and sanitisation of stored or imported data
 *   - a deterministic, clearly fictional demo dataset
 *
 * Loaded as a classic script so it works from file://, any static host and the
 * offline service-worker cache. It exposes a single frozen global: PowerhouseCore.
 */
(function (root) {
  'use strict';

  const BUILD = '5.1.0';
  const SCHEMA_VERSION = 12;
  const DEFAULT_TIMEZONE = 'Asia/Colombo';

  const SUBJECTS = Object.freeze(['physics', 'chemistry', 'biology']);
  const ERROR_NAMES = Object.freeze({
    K: 'Knowledge gap', C: 'Conceptual model', R: 'Retrieval failure',
    M: 'Method / calculation', P: 'Presentation', T: 'Timing / selection', A: 'Attention / misreading', G: 'Lucky / unsupported guess',
  });
  const ATTEMPT_TYPE_NAMES = Object.freeze({
    'topic-question': 'Topic question', 'mcq-set': 'MCQ set', 'structured-essay': 'Structured essay',
    essay: 'Essay', 'practical-data': 'Practical / data analysis', 'mixed-set': 'Mixed question set', 'mcq-section': 'MCQ section',
    'structured-section': 'Structured section', 'paper-section': 'Paper section', 'full-paper': 'Full paper',
    reattempt: 'Closed-book reattempt', 'fresh-transfer': 'Fresh transfer', 'delayed-retest': 'Delayed retest',
  });
  /** Attempt types that verify a repair rather than open a new evidence chain. */
  const VERIFICATION_TYPES = Object.freeze(['reattempt', 'fresh-transfer', 'delayed-retest']);
  const CONFIDENCE_LEVELS = Object.freeze(['low', 'medium', 'high']);
  const DAILY_FIELDS = Object.freeze([
    { id: 'mcqs', label: 'MCQs' },
    { id: 'structured', label: 'Structured Qs' },
    { id: 'essays', label: 'Essays' },
    { id: 'fullPapers', label: 'Full Papers' },
    { id: 'retests', label: 'Retests' },
  ]);
  const DEFAULT_RETEST_INTERVALS = Object.freeze([3, 7]);
  const PROGRESS_STEPS = Object.freeze([0, 25, 50, 75, 100]);

  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  const SAFE_ID = /^[A-Za-z0-9._:-]{1,100}$/;
  const TOPIC_KEY = /^(physics|chemistry|biology)\|\d{1,3}\|\d{1,3}$/;
  const SAFE_FIELD = /^[A-Za-z][A-Za-z0-9_]{0,40}$/;

  // ---------------------------------------------------------------- primitives

  const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

  function isISODate(value) {
    if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
    const d = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
  }

  function isTimestamp(value) {
    return typeof value === 'string' && value.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
  }

  function toNumber(value, { min = -Infinity, max = Infinity, fallback = 0, integer = false } = {}) {
    if (value === null || value === '' || typeof value === 'boolean') return fallback;
    let n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    if (integer) n = Math.round(n);
    return Math.min(max, Math.max(min, n));
  }

  function toText(value, max = 500) {
    if (value === null || value === undefined) return '';
    return String(value).slice(0, max);
  }

  function escapeHTML(value = '') {
    return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function makeId() {
    const c = root.crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
  }

  const safeId = (value, idFn = makeId) => (typeof value === 'string' && SAFE_ID.test(value) ? value : idFn());
  const optionalId = value => (typeof value === 'string' && SAFE_ID.test(value) ? value : null);
  const clone = value => JSON.parse(JSON.stringify(value));

  // ---------------------------------------------------------------------- dates

  /** Calendar date (YYYY-MM-DD) for `now` in the given IANA time zone. */
  function zonedToday(timeZone = DEFAULT_TIMEZONE, now = new Date()) {
    try {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
          .formatToParts(now)
          .filter(p => p.type !== 'literal')
          .map(p => [p.type, p.value]),
      );
      return `${parts.year}-${parts.month}-${parts.day}`;
    } catch (_) {
      return now.toISOString().slice(0, 10);
    }
  }

  /** Adds whole days to a calendar date without any local-time-zone drift. */
  function addDays(date, days) {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + Number(days || 0));
    return d.toISOString().slice(0, 10);
  }

  function dateDiffDays(from, to) {
    return Math.round((new Date(`${to}T12:00:00Z`) - new Date(`${from}T12:00:00Z`)) / 86400000);
  }

  // ------------------------------------------------------------- evidence model

  const hasTrusted = a => a && a.trustedEarned !== null && a.trustedEarned !== undefined && a.trustedEarned !== '';

  /** Marks the student actually trusts (honest re-mark), falling back to raw marks. */
  const trustedMarks = a => (hasTrusted(a) ? Number(a.trustedEarned) : Number(a.earned));

  /**
   * A clean pass: full raw marks, full trusted marks, no guessed items and no error
   * family. Anything less leaves the weakness open.
   */
  function isFullPass(a) {
    if (!a) return false;
    const total = Number(a.total);
    return Number(a.earned) === total && trustedMarks(a) === total && Number(a.guesses || 0) === 0 && !a.error;
  }

  /** Whether an attempt opens an evidence chain that needs transfer + delayed retests. */
  function needsRetest(a) {
    if (!a || VERIFICATION_TYPES.includes(a.type)) return false;
    return Number(a.earned) < Number(a.total) || Boolean(a.error) || Number(a.guesses || 0) > 0;
  }

  function normalizeIntervals(value) {
    if (!Array.isArray(value) || value.length < 2) return [...DEFAULT_RETEST_INTERVALS];
    const nums = value.slice(0, 2).map(n => Number(n));
    return nums.every(n => Number.isFinite(n) && n >= 0 && n <= 365) ? nums : [...DEFAULT_RETEST_INTERVALS];
  }

  /** Builds the two scheduled checks (fresh transfer, delayed stability) for a source attempt. */
  function createRetests(attempt, intervals = DEFAULT_RETEST_INTERVALS, idFn = makeId) {
    if (!needsRetest(attempt)) return [];
    const [first, second] = normalizeIntervals(intervals);
    return [
      { id: idFn(), sourceAttemptId: attempt.id, topicKey: attempt.topicKey, due: addDays(attempt.date, first), stage: 1, completedAt: null, failures: 0, attempts: [] },
      { id: idFn(), sourceAttemptId: attempt.id, topicKey: attempt.topicKey, due: addDays(attempt.date, second), stage: 2, completedAt: null, failures: 0, attempts: [] },
    ];
  }

  /**
   * Records a verification attempt against at most ONE eligible scheduled check.
   * When the student launched the attempt from a specific retest (`attempt.retestId`)
   * only that check is touched; otherwise a check is linked only if it is unambiguous.
   * Returns the updated retest, or null when nothing was eligible.
   */
  function applyRetestOutcome(retests, attempt) {
    if (!attempt || !['fresh-transfer', 'delayed-retest'].includes(attempt.type)) return null;
    const stage = attempt.type === 'fresh-transfer' ? 1 : 2;
    const eligible = retests
      .filter(r => !r.completedAt && r.topicKey === attempt.topicKey && r.stage === stage && r.due <= attempt.date && r.sourceAttemptId !== attempt.id)
      .sort((a, b) => a.due.localeCompare(b.due));
    let retest = null;
    if (attempt.retestId) retest = eligible.find(r => r.id === attempt.retestId) || null;
    else if (eligible.length === 1) retest = eligible[0];
    if (!retest) return null;

    const passed = isFullPass(attempt);
    retest.attempts = Array.isArray(retest.attempts) ? retest.attempts : [];
    retest.attempts.push({ attemptId: attempt.id, date: attempt.date, passed });
    retest.lastAttemptId = attempt.id;
    if (passed) {
      retest.completedAt = attempt.date;
      retest.status = 'passed';
    } else {
      retest.failures = Number(retest.failures || 0) + 1;
      retest.lastFailedAt = attempt.date;
      retest.status = 'failed-open';
    }
    return retest;
  }

  /**
   * Re-derives a retest's outcome from the attempts that still exist, so that
   * deleting or correcting evidence can never leave a check falsely closed.
   */
  function recomputeRetest(retest, attemptsById) {
    const entries = (retest.attempts || [])
      .filter(e => e && attemptsById.has(e.attemptId))
      .map(e => {
        const a = attemptsById.get(e.attemptId);
        return { attemptId: a.id, date: a.date, passed: isFullPass(a) };
      })
      .sort((x, y) => x.date.localeCompare(y.date));
    const firstPass = entries.find(e => e.passed);
    const kept = firstPass ? entries.slice(0, entries.indexOf(firstPass) + 1) : entries;
    const failures = kept.filter(e => !e.passed);
    retest.attempts = kept;
    retest.failures = failures.length;
    retest.lastAttemptId = kept.length ? kept[kept.length - 1].attemptId : null;
    retest.lastFailedAt = failures.length ? failures[failures.length - 1].date : null;
    if (firstPass) {
      retest.completedAt = firstPass.date;
      retest.status = 'passed';
    } else {
      retest.completedAt = null;
      if (kept.length) retest.status = 'failed-open';
      else delete retest.status;
    }
    return retest;
  }

  /** Removes an attempt and everything that depended on it. Mutates `state`. */
  function deleteAttempt(state, attemptId) {
    state.attempts = state.attempts.filter(a => a.id !== attemptId);
    const before = state.retests.length;
    state.retests = state.retests.filter(r => r.sourceAttemptId !== attemptId);
    if (Array.isArray(state.repairEvents)) state.repairEvents = state.repairEvents.filter(r => r.sourceAttemptId !== attemptId);
    const byId = new Map(state.attempts.map(a => [a.id, a]));
    let reopened = 0;
    state.retests.forEach(r => {
      if (!(r.attempts || []).some(e => e && e.attemptId === attemptId)) return;
      const wasClosed = Boolean(r.completedAt);
      recomputeRetest(r, byId);
      if (wasClosed && !r.completedAt) reopened += 1;
    });
    return { removedRetests: before - state.retests.length, reopened };
  }

  /**
   * Keeps the retest schedule consistent after an attempt is corrected:
   *  - checks this attempt verified are re-evaluated against the corrected marks;
   *  - a source attempt that now shows lost marks gets its checks scheduled;
   *  - untouched checks follow a corrected date/topic, or disappear if the
   *    correction shows full credit.
   */
  function reconcileEditedAttempt(state, attempt, intervals = DEFAULT_RETEST_INTERVALS, idFn = makeId) {
    const byId = new Map(state.attempts.map(a => [a.id, a]));
    state.retests.forEach(r => {
      if ((r.attempts || []).some(e => e && e.attemptId === attempt.id)) recomputeRetest(r, byId);
    });
    if (VERIFICATION_TYPES.includes(attempt.type)) {
      state.retests = state.retests.filter(r => r.sourceAttemptId !== attempt.id || (r.attempts || []).length || r.completedAt);
      return;
    }
    const own = state.retests.filter(r => r.sourceAttemptId === attempt.id);
    const untouched = r => !r.completedAt && !(r.attempts || []).length;
    if (needsRetest(attempt)) {
      if (!own.length) {
        state.retests.push(...createRetests(attempt, intervals, idFn));
        return;
      }
      const [first, second] = normalizeIntervals(intervals);
      own.filter(untouched).forEach(r => {
        r.topicKey = attempt.topicKey;
        r.due = addDays(attempt.date, r.stage === 1 ? first : second);
      });
    } else {
      state.retests = state.retests.filter(r => r.sourceAttemptId !== attempt.id || !untouched(r));
    }
  }

  // ------------------------------------------------------ sanitisation / schema

  const ATTEMPT_FIELDS = new Set(['id', 'date', 'subject', 'topicKey', 'type', 'question', 'earned', 'trustedEarned', 'total', 'minutes', 'items', 'guesses', 'confidence', 'error', 'note', 'createdAt', 'updatedAt', 'retestId', 'sessionId']);

  /** Keeps extra primitive fields written by newer builds, never anything executable. */
  function passthrough(raw, known) {
    const out = {};
    Object.keys(raw).forEach(key => {
      if (known.has(key) || !SAFE_FIELD.test(key)) return;
      const v = raw[key];
      if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
      else if (typeof v === 'boolean') out[key] = v;
      else if (typeof v === 'string') out[key] = v.slice(0, 500);
    });
    return out;
  }

  function sanitizeAttempt(raw, idFn = makeId) {
    if (!isPlainObject(raw)) return null;
    const topicKey = typeof raw.topicKey === 'string' && TOPIC_KEY.test(raw.topicKey) ? raw.topicKey : '';
    const subject = SUBJECTS.includes(raw.subject) ? raw.subject : (topicKey ? topicKey.split('|')[0] : null);
    if (!subject || (topicKey && topicKey.split('|')[0] !== subject)) return null;
    const date = isISODate(raw.date) ? raw.date : (isTimestamp(raw.createdAt) ? raw.createdAt.slice(0, 10) : null);
    if (!date || !isISODate(date)) return null;
    const total = toNumber(raw.total, { min: 0, max: 10000, fallback: NaN });
    if (!Number.isFinite(total) || total <= 0) return null;
    const earned = toNumber(raw.earned, { min: 0, max: total, fallback: 0 });
    const trustedEarned = hasTrusted(raw) ? toNumber(raw.trustedEarned, { min: 0, max: earned, fallback: earned }) : null;
    return {
      ...passthrough(raw, ATTEMPT_FIELDS),
      id: safeId(raw.id, idFn),
      date,
      subject,
      topicKey,
      type: Object.prototype.hasOwnProperty.call(ATTEMPT_TYPE_NAMES, raw.type) ? raw.type : 'topic-question',
      question: toText(raw.question, 200),
      earned,
      trustedEarned,
      total,
      minutes: toNumber(raw.minutes, { min: 0, max: 1440, fallback: 0 }),
      items: toNumber(raw.items, { min: 1, max: 1000, fallback: 1, integer: true }),
      guesses: toNumber(raw.guesses, { min: 0, max: 1000, fallback: 0, integer: true }),
      confidence: CONFIDENCE_LEVELS.includes(raw.confidence) ? raw.confidence : 'medium',
      error: Object.prototype.hasOwnProperty.call(ERROR_NAMES, raw.error) ? raw.error : '',
      note: toText(raw.note, 500),
      createdAt: isTimestamp(raw.createdAt) ? raw.createdAt : `${date}T00:00:00.000Z`,
      updatedAt: isTimestamp(raw.updatedAt) ? raw.updatedAt : null,
      retestId: optionalId(raw.retestId),
      sessionId: optionalId(raw.sessionId),
    };
  }

  function sanitizeRetest(raw, idFn = makeId) {
    if (!isPlainObject(raw)) return null;
    if (typeof raw.topicKey !== 'string' || !TOPIC_KEY.test(raw.topicKey) || !isISODate(raw.due)) return null;
    const stage = Number(raw.stage) === 2 ? 2 : Number(raw.stage) === 1 ? 1 : null;
    if (!stage) return null;
    const attempts = Array.isArray(raw.attempts)
      ? raw.attempts
        .filter(e => isPlainObject(e) && optionalId(e.attemptId) && isISODate(e.date))
        .map(e => ({ attemptId: e.attemptId, date: e.date, passed: e.passed === true }))
      : [];
    const out = {
      id: safeId(raw.id, idFn),
      sourceAttemptId: optionalId(raw.sourceAttemptId),
      topicKey: raw.topicKey,
      due: raw.due,
      stage,
      completedAt: isISODate(raw.completedAt) ? raw.completedAt : null,
      failures: toNumber(raw.failures, { min: 0, max: 1000, fallback: 0, integer: true }),
      attempts,
    };
    if (raw.status === 'passed' || raw.status === 'failed-open') out.status = raw.status;
    if (optionalId(raw.lastAttemptId)) out.lastAttemptId = raw.lastAttemptId;
    if (isISODate(raw.lastFailedAt)) out.lastFailedAt = raw.lastFailedAt;
    return out;
  }

  function sanitizeRepairEvent(raw, idFn = makeId) {
    if (!isPlainObject(raw) || !optionalId(raw.sourceAttemptId)) return null;
    return {
      id: safeId(raw.id, idFn),
      sourceAttemptId: raw.sourceAttemptId,
      completedAt: isISODate(raw.completedAt) ? raw.completedAt : null,
      createdAt: isTimestamp(raw.createdAt) ? raw.createdAt : null,
      rule: toText(raw.rule, 500),
    };
  }

  function sanitizeDailyEntry(raw, idFn = makeId) {
    if (!isPlainObject(raw) || !isISODate(raw.date)) return null;
    const out = { id: safeId(raw.id, idFn), date: raw.date, timestamp: isTimestamp(raw.timestamp) ? raw.timestamp : null, note: toText(raw.note, 140) };
    SUBJECTS.forEach(subject => {
      out[subject] = {};
      DAILY_FIELDS.forEach(field => {
        out[subject][field.id] = toNumber(raw[subject] && raw[subject][field.id], { min: 0, max: 9999, fallback: 0 });
      });
    });
    return out;
  }

  function sanitizeRatings(raw) {
    const out = {};
    if (!isPlainObject(raw)) return out;
    Object.keys(raw).forEach(key => {
      const v = Number(raw[key]);
      if (TOPIC_KEY.test(key) && [1, 2, 3].includes(v)) out[key] = v;
    });
    return out;
  }

  function sanitizeProgress(raw) {
    const out = {};
    if (!isPlainObject(raw)) return out;
    Object.keys(raw).forEach(key => {
      const v = Number(raw[key]);
      if (/^[a-z0-9-]{1,60}$/.test(key) && PROGRESS_STEPS.includes(v)) out[key] = v;
    });
    return out;
  }

  function sanitizeProfile(raw, base) {
    const p = isPlainObject(raw) ? raw : {};
    return {
      ...base,
      name: p.name === undefined ? base.name : toText(p.name, 80),
      year: p.year === undefined ? base.year : toText(p.year, 8),
      target: p.target === undefined ? base.target : toText(p.target, 100),
      line: p.line === undefined ? base.line : toText(p.line, 140),
    };
  }

  function blankDailyValues() {
    const out = {};
    SUBJECTS.forEach(subject => {
      out[subject] = {};
      DAILY_FIELDS.forEach(field => { out[subject][field.id] = 0; });
    });
    return out;
  }

  const OLD_V6_DAILY_TARGETS = Object.freeze({
    physics: { mcqs: 20, structured: 1, essays: 0, fullPapers: 0, retests: 1 },
    chemistry: { mcqs: 20, structured: 1, essays: 0, fullPapers: 0, retests: 1 },
    biology: { mcqs: 20, structured: 1, essays: 0, fullPapers: 0, retests: 1 },
  });

  function normalizeDailyTargets(value) {
    const out = blankDailyValues();
    if (!isPlainObject(value)) return out;
    // Earlier builds shipped aggressive default quotas; they are reset to "no target".
    if (JSON.stringify(value) === JSON.stringify(OLD_V6_DAILY_TARGETS)) return out;
    SUBJECTS.forEach(subject => DAILY_FIELDS.forEach(field => {
      const n = Number(value[subject] && value[subject][field.id]);
      if (Number.isFinite(n) && n >= 0) out[subject][field.id] = Math.min(n, 9999);
    }));
    return out;
  }

  function defaultState() {
    return {
      version: SCHEMA_VERSION,
      schemaVersion: SCHEMA_VERSION,
      productVersion: 'V5',
      buildVersion: BUILD,
      profile: { name: 'A/L Student', year: '2027', target: '', line: '2027 A/L Bio Science · evidence over guesswork' },
      profileSetupComplete: false,
      ratings: {},
      syllabusProgress: {},
      attempts: [],
      retests: [],
      repairEvents: [],
      v5Settings: { retestIntervals: [...DEFAULT_RETEST_INTERVALS], timezone: DEFAULT_TIMEZONE, shareSafe: false, searchScope: 'all' },
      migration: { sourceVersion: null, migratedAt: null, baselineSnapshotId: null },
      dailyTargets: blankDailyValues(),
      dailyEntries: [],
      courseCorrection: { disciplineMode: true, targetDate: '', dailyAudits: {}, rabbitHoleEvents: [], planningOverrides: [], rescueRuns: [] },
      legacyArchiveCount: 0,
      lastExportedAt: null,
    };
  }

  function sanitizeList(list, fn, idFn, report, label) {
    if (!Array.isArray(list)) return [];
    const out = [];
    const seen = new Set();
    list.forEach(item => {
      const clean = fn(item, idFn);
      if (!clean) { report.dropped[label] = (report.dropped[label] || 0) + 1; return; }
      if (seen.has(clean.id)) clean.id = idFn();
      seen.add(clean.id);
      out.push(clean);
    });
    return out;
  }

  function sanitizeEvents(list, max) {
    if (!Array.isArray(list)) return [];
    return list
      .filter(isPlainObject)
      .slice(0, max)
      .map(e => ({
        id: optionalId(e.id) || makeId(),
        date: isISODate(e.date) ? e.date : null,
        at: isTimestamp(e.at) ? e.at : null,
        ...(typeof e.type === 'string' && /^[a-z-]{1,30}$/.test(e.type) ? { type: e.type } : {}),
      }))
      .filter(e => e.date);
  }

  function sanitizeCourseCorrection(raw, base) {
    const cc = isPlainObject(raw) ? raw : {};
    const audits = {};
    if (isPlainObject(cc.dailyAudits)) {
      Object.keys(cc.dailyAudits).forEach(date => {
        if (!isISODate(date) || !isPlainObject(cc.dailyAudits[date])) return;
        audits[date] = {};
        Object.keys(cc.dailyAudits[date]).forEach(k => {
          if (SAFE_FIELD.test(k)) audits[date][k] = cc.dailyAudits[date][k] === true;
        });
      });
    }
    return {
      ...base,
      disciplineMode: cc.disciplineMode !== false,
      targetDate: isISODate(cc.targetDate) ? cc.targetDate : '',
      dailyAudits: audits,
      rabbitHoleEvents: sanitizeEvents(cc.rabbitHoleEvents, 100),
      planningOverrides: sanitizeEvents(cc.planningOverrides, 100),
      rescueRuns: sanitizeEvents(cc.rescueRuns, 50),
    };
  }

  /**
   * Turns anything previously saved — by this build, an older build, or an
   * imported file — into a valid current-schema state. Invalid records are
   * dropped and counted in `report.dropped`; nothing is rendered unsanitised.
   */
  function normalizeState(saved, options = {}) {
    const idFn = options.idFn || makeId;
    const report = { dropped: {} };
    const base = defaultState();
    if (options.legacyRatings) base.ratings = sanitizeRatings(options.legacyRatings);
    if (!isPlainObject(saved)) return { state: base, report };

    const v5 = isPlainObject(saved.v5Settings) ? saved.v5Settings : {};
    const migration = isPlainObject(saved.migration) ? saved.migration : {};
    const state = {
      ...base,
      profileSetupComplete: options.profileSetupComplete !== undefined ? Boolean(options.profileSetupComplete) : (saved.profileSetupComplete === undefined ? true : Boolean(saved.profileSetupComplete)),
      profile: sanitizeProfile(saved.profile, base.profile),
      ratings: isPlainObject(saved.ratings) ? sanitizeRatings(saved.ratings) : base.ratings,
      syllabusProgress: sanitizeProgress(saved.syllabusProgress),
      attempts: sanitizeList(saved.attempts, sanitizeAttempt, idFn, report, 'attempts'),
      retests: sanitizeList(saved.retests, sanitizeRetest, idFn, report, 'retests'),
      repairEvents: sanitizeList(saved.repairEvents, sanitizeRepairEvent, idFn, report, 'repairEvents'),
      v5Settings: {
        ...base.v5Settings,
        retestIntervals: normalizeIntervals(v5.retestIntervals),
        shareSafe: v5.shareSafe === true,
        searchScope: typeof v5.searchScope === 'string' && /^[a-z]{1,20}$/.test(v5.searchScope) ? v5.searchScope : 'all',
      },
      migration: {
        sourceVersion: typeof migration.sourceVersion === 'string' ? migration.sourceVersion.slice(0, 80) : null,
        migratedAt: isTimestamp(migration.migratedAt) ? migration.migratedAt : null,
        baselineSnapshotId: optionalId(migration.baselineSnapshotId),
      },
      dailyTargets: normalizeDailyTargets(saved.dailyTargets),
      dailyEntries: sanitizeList(saved.dailyEntries, sanitizeDailyEntry, idFn, report, 'dailyEntries'),
      courseCorrection: sanitizeCourseCorrection(saved.courseCorrection, base.courseCorrection),
      legacyArchiveCount: toNumber(saved.legacyArchiveCount, { min: 0, max: 1000, fallback: 0, integer: true }),
      lastExportedAt: isTimestamp(saved.lastExportedAt) ? saved.lastExportedAt : null,
    };
    return { state, report };
  }

  /**
   * Classifies an uploaded JSON document before anything is written.
   * kinds: 'backup' (core or unified V5 backup), 'legacy-ratings', 'other', 'invalid'.
   */
  function inspectImport(parsed) {
    if (!isPlainObject(parsed) && !Array.isArray(parsed)) {
      return { kind: 'invalid', message: 'That file is not a Performance Powerhouse backup.' };
    }
    let core = parsed;
    let studyTracker = null;
    let physicsIntelligence = null;
    if (isPlainObject(parsed) && parsed.product === 'A/L Performance Powerhouse') {
      if (!isPlainObject(parsed.core)) return { kind: 'invalid', message: 'This backup is missing its core study record.' };
      core = parsed.core;
      if (isPlainObject(parsed.study_tracker)) studyTracker = parsed.study_tracker;
      if (isPlainObject(parsed.physics_intelligence)) physicsIntelligence = parsed.physics_intelligence;
    }
    if (isPlainObject(core) && Array.isArray(core.attempts) && (isPlainObject(core.ratings) || core.ratings === undefined)) {
      const { state, report } = normalizeState(core, { profileSetupComplete: true });
      const dropped = Object.values(report.dropped).reduce((n, v) => n + v, 0);
      return {
        kind: 'backup', state, report, studyTracker, physicsIntelligence, dropped,
        summary: `${state.attempts.length} attempt(s), ${state.retests.length} scheduled check(s), ${state.dailyEntries.length} daily-output entr${state.dailyEntries.length === 1 ? 'y' : 'ies'}` +
          (dropped ? ` · ${dropped} invalid record(s) will be skipped` : ''),
      };
    }
    if (isPlainObject(core)) {
      const entries = Object.entries(core);
      if (entries.length && entries.every(([key, value]) => TOPIC_KEY.test(key) && [1, 2, 3].includes(Number(value)))) {
        return { kind: 'legacy-ratings', ratings: sanitizeRatings(core), count: entries.length };
      }
    }
    return { kind: 'other' };
  }

  // ------------------------------------------------------------------- analysis

  /** Marks lost per error family across a set of attempts. */
  function lostMarksByError(attempts) {
    const out = Object.fromEntries(Object.keys(ERROR_NAMES).map(k => [k, 0]));
    attempts.forEach(a => {
      if (a.error && out[a.error] !== undefined) out[a.error] += Math.max(0, Number(a.total) - Number(a.earned));
    });
    return out;
  }

  /**
   * Repair priority for one topic: lost marks dominate, recurrence and confidence
   * traps (high confidence but wrong) are weighted heavily, and outstanding
   * retest debt keeps a topic visible until it is closed.
   */
  function repairPriorityScore({ lost = 0, errorAttempts = 0, highConfidence = 0, guesses = 0, due = 0, recent = false } = {}) {
    const recurrence = Math.max(0, errorAttempts - 1);
    return lost * 3 + recurrence * 5 + highConfidence * 4 + guesses * 1.5 + due * 4 + (recent ? 2 : 0);
  }

  // ----------------------------------------------------------------- demo data

  /**
   * A small, deterministic and clearly fictional record used by `?demo=1` so
   * reviewers can see a populated dashboard without creating any data.
   */
  function buildDemoState(today) {
    let n = 0;
    const idFn = () => `demo-${(++n).toString().padStart(3, '0')}`;
    const { state } = normalizeState({}, { profileSetupComplete: true });
    state.profile = { name: 'Demo Student', year: '2027', target: 'Fictional sample data', line: 'Demo mode · fictional data · nothing is saved' };
    state.profileSetupComplete = true;
    state.ratings = { 'physics|1|5': 1, 'physics|7|4': 2, 'chemistry|11|2': 1, 'chemistry|8|8': 2, 'biology|4|9': 1, 'biology|5|7': 3 };
    state.syllabusProgress = { 'physics-12-measurements': 100, 'physics-12-mechanics': 75, 'physics-12-waves': 50, 'chemistry-12-01': 100, 'chemistry-12-02': 75, 'chemistry-13-12': 25, 'biology-12-02': 100, 'biology-12-13-05': 50, 'biology-13-06': 25 };
    state.lastExportedAt = `${addDays(today, -2)}T10:00:00.000Z`;

    const rows = [
      // [daysAgo, subject, topicKey, type, question, earned, total, minutes, confidence, error, guesses, note]
      [20, 'physics', 'physics|1|5', 'topic-question', 'Circular motion · banked track', 4, 10, 25, 'high', 'C', 0, 'Draw the free-body diagram before choosing an equation.'],
      [18, 'chemistry', 'chemistry|11|2', 'structured-essay', 'Kp from partial pressures', 6, 12, 30, 'medium', 'M', 0, 'Convert mole fractions before substituting.'],
      [17, 'biology', 'biology|4|9', 'mcq-set', 'Cardiac conduction MCQs', 7, 10, 15, 'medium', 'R', 1, 'SA node → AV node → bundle of His → Purkinje fibres.'],
      [16, 'physics', 'physics|7|4', 'mcq-set', 'Kirchhoff laws set', 9, 10, 18, 'medium', 'A', 0, 'Mark the direction of every assumed current first.'],
      [14, 'physics', 'physics|1|5', 'reattempt', 'Closed-book reattempt · banked track', 10, 10, 20, 'medium', '', 0, ''],
      [12, 'biology', 'biology|5|7', 'structured-essay', 'Dihybrid cross explanation', 10, 10, 20, 'high', '', 0, ''],
      [11, 'chemistry', 'chemistry|8|8', 'mcq-set', 'Electrophilic substitution', 8, 10, 15, 'low', 'P', 0, 'Name the electrophile explicitly in every mechanism.'],
      [10, 'physics', 'physics|1|5', 'fresh-transfer', 'Fresh transfer · conical pendulum', 10, 10, 22, 'medium', '', 0, ''],
      [9, 'biology', 'biology|4|9', 'reattempt', 'Closed-book reattempt · conduction', 10, 10, 12, 'medium', '', 0, ''],
      [7, 'chemistry', 'chemistry|11|2', 'fresh-transfer', 'Fresh transfer · Kc ↔ Kp', 9, 12, 25, 'high', 'M', 0, 'Δn uses gaseous moles only.'],
      [6, 'physics', 'physics|0|0', 'full-paper', 'Physics Paper I · timed', 38, 50, 120, 'medium', 'T', 2, 'Skip and return after 90 seconds on any single MCQ.'],
      [4, 'biology', 'biology|4|9', 'fresh-transfer', 'Fresh transfer · ECG interpretation', 10, 10, 15, 'medium', '', 0, ''],
      [3, 'physics', 'physics|1|5', 'delayed-retest', 'Delayed retest · vertical circle', 10, 10, 20, 'high', '', 0, ''],
      [1, 'chemistry', 'chemistry|2|7', 'mcq-set', 'Concentration & dilution', 10, 10, 12, 'high', '', 0, ''],
      [0, 'biology', 'biology|1|7', 'topic-question', 'Enzyme kinetics graph', 3, 6, 15, 'high', 'C', 0, 'Vmax depends on enzyme concentration, not substrate.'],
    ];
    rows.forEach(([ago, subject, topicKey, type, question, earned, total, minutes, confidence, error, guesses, note]) => {
      const date = addDays(today, -ago);
      const trustedEarned = type === 'full-paper' || type === 'mcq-set' ? Math.max(0, earned - guesses - (type === 'full-paper' ? 1 : 0)) : null;
      const attempt = sanitizeAttempt({ id: idFn(), date, subject, topicKey, type, question, earned, total, minutes, confidence, error, guesses, note, trustedEarned, createdAt: `${date}T09:00:00.000Z`, items: type === 'mcq-set' ? 10 : 1 });
      applyRetestOutcome(state.retests, attempt);
      state.attempts.push(attempt);
      state.retests.push(...createRetests(attempt, state.v5Settings.retestIntervals, idFn));
      if (['physics|1|5', 'biology|4|9', 'chemistry|11|2'].includes(topicKey) && !VERIFICATION_TYPES.includes(type) && error) {
        state.repairEvents.push({ id: idFn(), sourceAttemptId: attempt.id, completedAt: addDays(date, 1), createdAt: `${addDays(date, 1)}T08:00:00.000Z`, rule: note });
      }
    });
    [6, 5, 3, 2, 1, 0].forEach((ago, i) => {
      const entry = { id: idFn(), date: addDays(today, -ago), timestamp: `${addDays(today, -ago)}T18:00:00.000Z`, note: 'Sample evening block', ...blankDailyValues() };
      entry[SUBJECTS[i % 3]].mcqs = 10 + i * 2;
      entry[SUBJECTS[(i + 1) % 3]].structured = 1;
      state.dailyEntries.push(entry);
    });
    state.courseCorrection.dailyAudits[today] = { sleepProtected: true, planningCapped: true, aiAfterOutput: true, noResourceHunt: false, ownOutputFirst: true };
    return state;
  }

  root.PowerhouseCore = Object.freeze({
    BUILD, SCHEMA_VERSION, DEFAULT_TIMEZONE,
    SUBJECTS, ERROR_NAMES, ATTEMPT_TYPE_NAMES, VERIFICATION_TYPES, CONFIDENCE_LEVELS, DAILY_FIELDS, DEFAULT_RETEST_INTERVALS, OLD_V6_DAILY_TARGETS,
    isPlainObject, isISODate, isTimestamp, toNumber, toText, escapeHTML, makeId, clone,
    zonedToday, addDays, dateDiffDays,
    trustedMarks, isFullPass, needsRetest, normalizeIntervals, createRetests, applyRetestOutcome, recomputeRetest, deleteAttempt, reconcileEditedAttempt,
    sanitizeAttempt, sanitizeRetest, sanitizeRepairEvent, sanitizeDailyEntry, sanitizeRatings, sanitizeProgress,
    blankDailyValues, normalizeDailyTargets, defaultState, normalizeState, inspectImport,
    lostMarksByError, repairPriorityScore, buildDemoState,
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
