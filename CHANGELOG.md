# Changelog

All notable changes to Performance Powerhouse. Versions follow the `package.json` version;
storage-schema changes are called out explicitly.

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
