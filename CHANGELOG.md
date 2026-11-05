# Changelog

All notable changes to Performance Powerhouse. Versions follow the `package.json` version;
storage-schema changes are called out explicitly.

## 5.3.1 — 2026-11-05

Storage schema unchanged (12). No storage key renamed or removed. Bug fixes only.

### Fixed — evidence integrity
- **Correcting a verification attempt now re-derives its scheduled check properly.** Changing a
  fresh transfer or delayed retest's topic, type or date used to leave the check it had closed
  still closed — even by an attempt dated before the check was due, or now on another topic. The
  attempt is now unlinked from any check it no longer qualifies for (that check reopens) and, like a
  newly logged attempt, applied to the one check it now does qualify for. A launch link to a check
  the corrected attempt can no longer verify falls back to the unambiguous match.

### Fixed — data safety
- **Restoring a full backup no longer silently replaces Study Tracker and Physics Intelligence
  data.** Their current records are kept in each module's recovery list
  (`…_study_tracker_v1_recovery`, new `…_physics_intelligence_v1_recovery`) before the restore,
  and the confirmation now says those records will be replaced and how many each backup holds.
- Physics Intelligence's own import now asks for confirmation, keeps a recovery copy first, and
  reports an unreadable or wrong file instead of failing silently.

### Security and robustness
- **Study Tracker and Physics Intelligence now validate stored and imported records** through new
  tested core helpers (`PowerhouseCore.sanitizeTrackerState`, `sanitizePhysicsAttempts`), as the
  main app already did. Previously a crafted backup could inject markup into the tracker's history
  table (script execution was already blocked by the CSP), one malformed session crashed the whole
  tracker page, and an unknown Physics outcome produced `NaN` scores. The full-backup import
  validates these blocks before writing them. If validation must skip records, the original stored
  record is kept in the module's recovery list first, once.
- Both companion pages now load `js/core.js` (already in the offline cache).

### Tests
- 15 new unit tests (edit re-derivation, companion sanitisers, import summary) and 3 browser
  regression tests (tracker injection and recovery, companion snapshot on restore, Physics
  validation and import feedback). Each new test fails on 5.3.0.

## 5.3.0 — 2026-10-31

Storage schema unchanged (12). No user-visible behaviour change.

### Changed
- The evidence-chain lifecycle (Diagnosed → Repair → Reattempt → Transfer → Delayed retest →
  Closed / Reopened), recovery metrics and confidence calibration moved from the V5 UI layer into
  `PowerhouseCore.evidenceModel` and `PowerhouseCore.calibrationMetrics`, where they are typed and
  unit-tested. Every panel was rendered by the 5.2.0 and 5.3.0 code on three datasets (the demo
  record, 3,000 attempts, and a dataset covering every chain state) and the output is identical.

### Added
- Unit tests for every chain stage, ordering, relapse, recovery on the same mark scale, and
  calibration. They also pin one existing behaviour for a maintainer decision: a clean later stage
  after the repair can skip earlier stages (for example, a clean delayed retest alone closes a
  chain).
- Keyboard tests: tabs, expandable syllabus units, the log dialog's focus trap and focus return,
  logging a full attempt without a mouse, and a visible focus indicator on key controls.

## 5.2.0 — 2026-10-31

Storage schema unchanged (12).

### Performance
- **Dashboard refresh is about 45× faster for long study histories.** With 3,000 logged attempts
  (roughly a year of daily use) every save froze the app for about 9 seconds; it now takes about
  0.2 seconds. Three causes were fixed:
  - the student's "today" built a new date formatter on every call, thousands of times per render;
  - the V5 layer rebuilt every evidence chain about 50 times per refresh, each time rescanning all
    attempts — chains and a per-topic index are now cached until the record changes;
  - topic ranking rescanned all attempts and retests once per syllabus topic.
- Output verified identical: all 15 panels rendered by the old and new code match on both the
  3,000-attempt dataset and the demo record. A browser test now fails if a 3,000-attempt refresh
  exceeds 1.5 seconds.

### Changed
- Repair and topic ranking moved into the tested core as `PowerhouseCore.repairIntelligence` and
  `PowerhouseCore.topicPriorities`, each a single pass over the evidence.
- All source formatted with Prettier (previously several files stored functions on single lines
  of up to 3,924 characters). Verified by pixel-diffing 38 full-page screenshots before and after.
  `.git-blame-ignore-revs` hides the formatting commit from `git blame`.
- `js/core.js` is type-checked in TypeScript strict mode through JSDoc types (no build step).

### Security and supply chain
- Every GitHub Action is pinned to a full commit SHA; checkouts no longer persist credentials.
- OpenSSF Scorecard runs weekly and publishes a public supply-chain score.
- Release zips carry signed build provenance (`gh attestation verify`), proving they were built
  by this repository's CI from the tagged commit.

### CI
- New checks: `format:check` and `typecheck`.

## 5.1.1 — 2026-10-23

Storage schema unchanged (12).

### Accessibility
- Every main-app panel, dialog and companion page now passes an automated WCAG 2.1 AA audit
  (axe-core) that runs in CI.
- Labelled the retest-interval inputs, the search box and subject filter, and the Study Tracker
  filters; made the search results and weekly report keyboard-focusable regions.
- Raised low-contrast secondary text, fixed links styled as buttons, and gave the Physics
  Intelligence heatmap two contrast-safe colour bands so every cell value is readable.

### Added
- SVG favicon, home-screen icon, and Open Graph/Twitter preview card with a 1280×640 image.
- `npm run validate:data`: checks that every Physics Intelligence total, era summary and question
  family is reproducible from the per-year rows, that no question appears in two families, and that
  the file contains no question or answer text. Runs in CI.
- Browser tests for full offline use through the service worker, and for the Study Tracker →
  evidence-ledger hand-off.
- Enforced coverage thresholds for `js/core.js` (currently ~99.9% lines, ~90% branches).
- Automatic GitHub Releases: a version bump on `main` tags the commit and publishes the matching
  CHANGELOG section with a zipped static build.

### Changed
- Dev tooling updated (ESLint 10, Playwright 1.64). CI tests on Node 22 and 24.
- The live-demo workflow now skips with a notice, instead of failing, until GitHub Pages is enabled.

## 5.1.0 — 2026-10-22

Storage schema unchanged (12). Existing records load and migrate exactly as before.

### Security
- **Fixed stored cross-site scripting through backup import.** A crafted backup file could place
  markup in fields (error family, ids, subject, marks) that were rendered with `innerHTML`, and
  the injected script executed when the dashboard rendered. Every stored or imported record now
  passes through a sanitiser (`PowerhouseCore.normalizeState`), the affected render paths escape
  their output, and a regression test imports a hostile backup and asserts nothing executes.
- Added a strict Content-Security-Policy (`script-src 'self'`, no third-party origins) and a
  no-referrer policy to every page. All inline scripts and styles were moved into files.
- Imports are now validated and summarised before anything is written; the student confirms, and
  a recovery snapshot is still taken first. Invalid JSON or oversized files are rejected cleanly.

### Fixed
- Deleting the attempt that closed a scheduled check left the check closed with no evidence. The
  check now reopens and its outcome is re-derived from the remaining attempts.
- Editing an attempt did not update its retest schedule. Corrections now schedule missing checks,
  remove untouched checks when the correction shows full credit, move untouched checks with a
  corrected date or topic, and re-evaluate any check a corrected verification attempt had closed.
- The output-streak counter could skip or repeat a day in time zones far from UTC.

### Added
- **Demo mode** (`?demo=1` or "Explore sample data" on first run): a clearly labelled, fictional
  record held in memory only, so anyone can explore a populated dashboard without creating data.
- `js/core.js` (`PowerhouseCore`): the evidence rules, retest lifecycle, sanitisation and import
  inspection as one DOM-free module, unit-tested in Node.
- Test suite: 40 core unit tests, static integrity tests (ids, links, CSP, precache, versions)
  and Playwright browser tests on desktop and mobile Chromium.
- CI (lint, unit, browser), CodeQL analysis, GitHub Pages deployment of the live demo, Dependabot,
  and an optional Codex pull-request review workflow.
- `AGENTS.md` for coding agents, `docs/ARCHITECTURE.md`, issue forms, `CITATION.cff`.

### Changed
- Source reorganised: `index.html` now contains markup only; scripts live in `js/` and styles in
  `css/`. The service-worker cache was renamed to `powerhouse-v5.1.0` and its precache list updated.
- Historical release reports moved to `docs/archive/`. An unrelated Focus Notes Studio bundle was
  removed from the tree (it remains in Git history).

## 5.0.1 — 2026-10-12

- Isolated service-worker cache cleanup to Performance Powerhouse cache names.
- Restricted runtime caching to the declared application asset allowlist.
- Respected `Cache-Control: no-store` and `private` response directives.
- Attached asynchronous cache writes to the fetch-event lifetime.
- Added repeatable Node.js service-worker contract tests.

## V4.0 Community Edition

### Community readiness
- Replaced new-user personal defaults with neutral 2027 A/L Biological Science onboarding.
- Added exam-year and optional target fields while preserving migrated V3 identity lines.
- Added a 60-second in-product guide explaining TEST → MARK → DIAGNOSE → REPAIR → TRANSFER → RETEST.
- Added mobile floating quick-log control and responsive community navigation.

### Paper Engine / Error Engine
- Added explicit attempt types for closed-book reattempt, fresh transfer and delayed retest.
- Added subject-specific diagnosis guidance for Physics, Chemistry and Biology.
- Added Repairs dashboard with recent marks lost, dominant error family, retest closure, recurring priorities and closure queue.
- Added deterministic repair-priority scoring from the student's own marks lost, recurrence, confidence traps, guesses and retest debt.
- Tightened retest closure: one attempt can close only one eligible scheduled stage, preventing a single late attempt from falsely closing both transfer and stability checks.

### Privacy / reliability
- Added share-safe mode to obscure personal performance for screenshots.
- Added backup-health indicator and V4-specific backup naming.
- Added V3 → V4 migration using a new storage key while leaving V3 data untouched.
- Added PWA manifest, icons and offline service worker shell.

### Physics Intelligence
- Integrated the validated Physics Intelligence module as `/physics-intelligence/`.
- Preserved its separate local-storage key so module evidence cannot corrupt the main Powerhouse state.
- Preserved privacy-safe share mode and validated 2000–2025 / current-era evidence boundary.
- Updated its governing loop language to include fresh transfer and delayed retesting.

## 2026-08-24 — Final distribution refresh
- Preserved the QA-passed V4 application and storage schema without a cosmetic version-key change.
- Added `community-share.html` as an explicit public/community entry point.
- Community Share links directly into the existing privacy-safe `?share=1` modes for both the main Powerhouse and Physics Intelligence.
- Added `START_HERE.md` for handoff clarity.
- Bumped the service-worker cache namespace and included the Community Share launcher in the offline shell.
- Regenerated the full product integrity manifest for this distribution.
