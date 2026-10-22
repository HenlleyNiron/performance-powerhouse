# Security Policy

## Reporting a vulnerability

Please report vulnerabilities **privately** through GitHub's
[private vulnerability reporting](https://github.com/HenlleyNiron/performance-powerhouse/security/advisories/new)
rather than a public issue. Include the minimum detail needed to reproduce the problem.

Never post passwords, access tokens, real student records, backups containing personal data,
financial or medical information in an issue or report. Use demo mode (`?demo=1`) or a
hand-written minimal backup to demonstrate data-handling bugs.

I aim to acknowledge reports within 7 days. Fixes are released on `main` and noted in
`CHANGELOG.md`.

## Supported versions

Only the latest release on `main` (and the live demo built from it) receives fixes.

## Security model

- **Local-first.** Study records live in the browser's `localStorage`. The app makes no network
  requests for student data and has no backend, accounts, analytics or third-party scripts.
- **Untrusted input.** Stored state and imported backup files are validated and sanitised by
  `js/core.js` before use; imports are summarised and confirmed before anything is written.
- **Content-Security-Policy.** Every page ships `script-src 'self'` with no inline scripts or
  event-handler attributes, so injected markup cannot execute script.
- **Offline cache.** The service worker caches only an explicit allowlist of same-origin
  application files and never stores `no-store`/`private` responses.

Any future feature that transmits study data off-device is a security- and privacy-sensitive
architectural change and needs an explicit design review.

## Past advisories

- **5.1.0 (2026-10-22): stored XSS via crafted backup import** — fixed. See `CHANGELOG.md`.
