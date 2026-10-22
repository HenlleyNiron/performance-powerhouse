# Roadmap

This roadmap is intentionally small. The project should improve evidence quality without
becoming another high-maintenance productivity system.

## Done in 5.1.0

- Stronger import validation for malformed and hostile backup files
- Automated tests for the core repair/retest workflow (unit + browser)
- Demo mode so new students can see the loop before entering data
- Mobile header fixes for narrow screens

## Next

- Keyboard and screen-reader audit of every dialog and tab (automated axe checks in CI)
- Move rendering for the Repairs and Evidence panels onto `PowerhouseCore` helpers so more of the
  UI logic is unit-testable
- Per-subject retest intervals (currently one 3/7-day setting)
- Document the Physics Intelligence classification workflow and add a validation script for the
  dataset
- Optional Sinhala and Tamil interface text

## Maintenance principles

- Prefer bug fixes and evidence-loop improvements over feature accumulation
- Keep the app local-first, offline-capable and free of runtime dependencies
- Never rename or delete an existing storage key; migrate forward
- Do not add copyrighted question-paper dumps
- Do not require accounts or cloud storage for the basic workflow
- Treat any off-device data transmission as a privacy-sensitive architectural change
