# Contributing

Thank you for considering a contribution to Performance Powerhouse.

## Good contribution targets

- Reproducible bugs
- Accessibility and mobile usability
- Privacy / share-safe behaviour
- Data-export / migration reliability
- Documentation clarity
- Small improvements that strengthen the Attempt → Mark → Diagnose → Repair → Reattempt → Transfer → Retest loop

## Please avoid

- Adding large resource libraries or copyrighted exam-question dumps
- Turning the project into a general productivity dashboard
- Adding server-side collection of student records without an explicit privacy design
- Committing credentials, personal study records, financial documents or private communications

## Development

The app is intentionally static with zero runtime dependencies. Node.js 22+ is used only for
the dev server and tests.

```bash
npm ci                            # ESLint + Playwright (dev only)
npx playwright install chromium   # once
npm start                         # http://localhost:4173 (or any static server)
npm run check                     # lint, unit/integrity tests, browser tests
```

Read [`AGENTS.md`](AGENTS.md) before changing code: it lists the layout and the invariants that
protect students' data (storage keys, sanitisation, CSP, retest rules).

Before opening a pull request:

1. `npm run check` passes.
2. New rules go in `js/core.js` with a unit test; new UI flows get a browser test in `tests/e2e/`.
3. Try the change in demo mode (`?demo=1`) and with share-safe mode on.
4. New shipped files are listed in `sw.js` and `scripts/build-site.mjs`.

Pull requests receive an automated Codex first-pass review when the repository has an
`OPENAI_API_KEY` secret configured. The maintainer makes every merge decision.

## AI-assisted contributions

AI-assisted code is welcome. Contributors remain responsible for reviewing, testing and understanding what they submit. Please disclose substantial AI-generated changes in the pull-request description when useful for review.
