<div align="center">

# Performance Powerhouse

**A local-first study evidence system for Sri Lankan G.C.E. A/L Biological Science students.**

It answers one question: *what is costing marks, and has it actually been fixed?*

[![CI](https://github.com/HenlleyNiron/performance-powerhouse/actions/workflows/ci.yml/badge.svg)](https://github.com/HenlleyNiron/performance-powerhouse/actions/workflows/ci.yml)
[![CodeQL](https://github.com/HenlleyNiron/performance-powerhouse/actions/workflows/codeql.yml/badge.svg)](https://github.com/HenlleyNiron/performance-powerhouse/actions/workflows/codeql.yml)
[![Live demo](https://github.com/HenlleyNiron/performance-powerhouse/actions/workflows/pages.yml/badge.svg)](https://henlleyniron.github.io/performance-powerhouse/?demo=1)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Runtime dependencies: 0](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)

**[Try the demo with sample data →](https://henlleyniron.github.io/performance-powerhouse/?demo=1)**
&nbsp;·&nbsp; [Start your own record](https://henlleyniron.github.io/performance-powerhouse/)
&nbsp;·&nbsp; [Physics Intelligence](https://henlleyniron.github.io/performance-powerhouse/physics-intelligence/)

<img src="docs/screenshots/command.png" alt="Performance Powerhouse command view showing today's highest-return repair, why it was chosen and what counts as done" width="860">

</div>

## Why it exists

A/L students collect resources, trackers and revision plans, but rarely *prove* that a weakness
has been fixed. Recognising an answer you have already seen feels like mastery and is not.
Performance Powerhouse is built around the opposite rule: log the smallest piece of marked
evidence, find the mark leak that keeps recurring, repair that narrow cause, and require a fresh
question **after a delay** before calling it fixed.

```text
Attempt → Mark → Diagnose → Repair → Closed-book reattempt → Fresh transfer → Delayed retest
```

## What it does

| | |
| --- | --- |
| **Evidence ledger** | Log every marked attempt with raw and *trusted* marks, time, confidence, guessed items and one dominant error family (knowledge, concept, retrieval, method, presentation, timing, attention, guess). |
| **Repair priorities** | Ranks topics by marks lost, recurrence, confidence traps (high confidence, wrong answer) and unfinished retests — your own evidence, not a prediction. |
| **Retest lifecycle** | Every mark leak schedules a fresh-transfer check (+3 days) and a delayed stability check (+7 days). A check closes only on a clean pass: full marks, full trusted marks, no guesses. Later failures reopen it. |
| **Command view** | One recommended next block with *why this*, *what exactly* and *what counts as done*, plus a focus timer. |
| **Execution Lock** | Syllabus planning stays locked until a marked attempt exists today, with a recorded override. A "course-correct me" panel intercepts common procrastination loops. |
| **Physics Intelligence** | Aggregate distribution of 1,410 validated 2000–2025 Physics MCQs across units and 173 current-era question families. Descriptive only — it never predicts a paper. |
| **Study Tracker** | Timed sessions classified as evidence, supporting or passive work, linked back to the attempts they produced. |
| **Exports** | Unified JSON backup, weekly Markdown report, Anki-ready CSV of repair rules, and an `.ics` file of upcoming retests. |
| **Private by design** | Data stays in your browser. Share-safe mode hides personal scores for screenshots. Installable and fully offline. |

<table>
  <tr>
    <td width="68%"><img src="docs/screenshots/repairs.png" alt="Repairs view: lost marks, dominant error family, retest closure rate, ranked repair priorities and an overdue closure queue"></td>
    <td width="32%"><img src="docs/screenshots/mobile.png" alt="The command view on a phone"></td>
  </tr>
</table>

## Quick start

No account, no install, no build step.

- **Use it:** open the [live app](https://henlleyniron.github.io/performance-powerhouse/), or install it to your home screen from the browser menu.
- **Look around first:** add `?demo=1` to the URL for a fictional sample record that is never saved.
- **Run it locally:**

  ```bash
  git clone https://github.com/HenlleyNiron/performance-powerhouse.git
  cd performance-powerhouse
  npm start            # serves http://localhost:4173 — any static server works
  ```

  Opening `index.html` directly also works; the offline service worker activates on `https://` or `localhost`.

## Privacy and security

- Study records live in the browser's `localStorage` and are never transmitted. There is no
  backend, no analytics, no fonts or scripts from other origins.
- Every page ships a strict Content-Security-Policy (`script-src 'self'`).
- Stored and imported data is validated and sanitised before use. Imports are summarised and
  confirmed, and a recovery snapshot is taken before any destructive action.
- Older releases' data (V2 through V4) migrates forward automatically and the original keys are
  left untouched.

See [`SECURITY.md`](SECURITY.md) for the security model and how to report a vulnerability.

## How it is built

Plain HTML, CSS and JavaScript with **zero runtime dependencies**, so it loads quickly on low-end
phones and keeps working offline. The rules students depend on live in one DOM-free module,
[`js/core.js`](js/core.js), which the browser and the Node test runner load identically.

```text
index.html               markup only
js/core.js               PowerhouseCore: evidence rules, retest lifecycle, validation, demo data
js/app.js                controller: rendering, dialogs, storage, migration
js/v5-additions.js       evidence chains, papers, intelligence, weekly report, exports
css/                     styles
physics-intelligence/    aggregate Physics MCQ pattern explorer
study-tracker/           timed-session tracker
sw.js                    offline service worker (explicit precache allowlist)
tests/unit/              node:test — core rules, integrity checks, service-worker contract
tests/e2e/               Playwright — real browser flows on desktop and mobile
```

[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) has diagrams of the runtime, the retest state
machine, the trust boundary and every storage key.

## Quality

```bash
npm ci                              # dev tooling only
npx playwright install chromium     # once, for browser tests
npm run check                       # lint + unit/integrity tests + browser tests
```

Every push and pull request runs:

- **Unit tests** for the retest lifecycle, sanitisation, migration defaults and import inspection
- **Integrity tests** that fail on duplicate ids, missing elements, broken links, a missing CSP,
  missing offline assets or mismatched version numbers
- **Browser tests** (Chromium, desktop and Pixel 7) covering onboarding, the attempt → retest
  flow, V4 migration, backup round-trip, hostile-backup import, demo mode and mobile layout
- **ESLint**, **CodeQL** security analysis, and a **Codex** first-pass review on pull requests
  (`.github/workflows/codex-review.yml`, guided by [`AGENTS.md`](AGENTS.md))

## Project history and AI-assisted development

Performance Powerhouse was built and used through several web releases (V2–V5) before this
repository existed; the Git history begins with an honest import of that existing project rather
than invented commits. See [`docs/PROJECT_HISTORY.md`](docs/PROJECT_HISTORY.md).

It is maintained by **Henlley Niron Pushparajah**, an A/L student who uses it for his own
preparation. AI coding tools (OpenAI Codex, Claude Code and others) are used for implementation,
debugging, testing and documentation. Product direction, the evidence model, acceptance of every
change, releases and responsibility for the published software stay with the maintainer.
[`AGENTS.md`](AGENTS.md) documents the invariants any agent must respect.

## Contributing

Bug reports, accessibility fixes, documentation and narrowly scoped improvements to the evidence
loop are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) first. Never include personal
study records or copyrighted exam content in issues or pull requests.

## Licence

[MIT](LICENSE). Physics Intelligence publishes derived aggregate counts and taxonomy only, not
examination questions or answers — see [`docs/DATA_PROVENANCE.md`](docs/DATA_PROVENANCE.md).
