# Changelog — Performance Powerhouse V4 Community Edition

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
