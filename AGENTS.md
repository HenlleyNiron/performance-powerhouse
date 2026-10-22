# AGENTS.md

Guidance for AI coding agents (Codex, Claude Code and similar) and human contributors working in
this repository. Read this before changing code.

## What this project is

Performance Powerhouse is a **local-first, static** web app for Sri Lankan G.C.E. A/L Biological
Science students. It records marked practice and enforces one loop:

**Attempt → Mark → Diagnose → Repair → Closed-book reattempt → Fresh transfer → Delayed retest**

There is no backend, no account, no build step and no runtime dependency. Student data lives in
the browser's `localStorage` and leaves the device only when the student exports a backup.

## Layout

| Path | Role |
| --- | --- |
| `js/core.js` | Pure evidence logic: retest lifecycle, validation/sanitisation, import inspection, demo data. Exposes `PowerhouseCore`. **Put new logic here and unit-test it.** |
| `js/app.js` | Main controller: rendering, dialogs, storage, migration. Classic script. |
| `js/v5-additions.js` | V5 layer: evidence chains, papers, intelligence, weekly report, exports. Wraps `refreshAll` from `app.js`. |
| `css/` | Styles. `app.css` core, `v5.css` V5 layer. |
| `physics-intelligence/` | Aggregate 2000–2025 Physics MCQ pattern explorer (own storage key). |
| `study-tracker/` | Session tracker that hands evidence back to the main app via deep link. |
| `sw.js` | Offline service worker with an explicit precache allowlist. |
| `tests/unit/` | `node:test` suites: core logic, service worker contract, static integrity. |
| `tests/e2e/` | Playwright browser tests (desktop + mobile). |
| `scripts/` | `serve.mjs` (dev server), `build-site.mjs` (static bundle for Pages). |

`app.js` and `v5-additions.js` are **classic scripts that share top-level bindings** (e.g.
`state`, `refreshAll`). Do not convert them to ES modules without moving that shared state
behind an explicit interface first.

## Commands

```bash
npm ci                 # dev tooling only (ESLint, Playwright)
npm start              # http://localhost:4173
npm run lint
npm test               # unit + integrity tests (fast, no browser)
npm run test:e2e       # browser tests; first run: npx playwright install chromium
npm run check          # everything CI runs
```

Run `npm run check` before proposing a change.

## Invariants — do not break

1. **Never lose student data.** Do not rename, delete or repurpose storage keys:
   `al_performance_powerhouse_v5`, `..._v4`, `..._v3`, `al_performance_command_centre_v3..v6`,
   `al_v2_samra`, `..._v5_recovery`, `..._study_tracker_v1`, `..._physics_intelligence_v1`.
   Migrations copy forward and leave the source key untouched; destructive actions take a
   recovery snapshot first.
2. **Validate at the boundary.** Everything read from storage or an imported file goes through
   `PowerhouseCore.normalizeState` / `inspectImport`. Anything rendered with `innerHTML` must be
   sanitised there or wrapped in `escapeHTML`.
3. **CSP stays strict.** Every page ships `script-src 'self'`. No inline `<script>` blocks, no
   `on*=` attributes, no third-party scripts, fonts, analytics or CDNs.
4. **Evidence rules.** A scheduled check closes only on a clean pass (full raw and trusted marks,
   zero guesses, no error family). One attempt closes at most one check. Deleting or editing
   evidence re-derives every check it touched (`recomputeRetest`).
5. **No predictions.** The app reports the student's own evidence. It must not claim to predict
   grades, Z-scores, ranks or exam questions. Physics Intelligence is descriptive frequency only.
6. **Offline shell.** A new shipped file must be added to `ASSETS` in `sw.js` and to
   `PUBLISHED` in `scripts/build-site.mjs`; bump the cache name with the version.

## Versioning

`package.json` `version`, `PowerhouseCore.BUILD` and the `sw.js` cache name must match (an
integrity test enforces this). Record user-visible changes in `CHANGELOG.md`.

## Content boundaries

Do not add copyrighted exam papers, marking schemes or question text. Do not commit personal
study records, names of real students, credentials or private documents.
