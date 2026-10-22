# Deployment notes — final community distribution

Deploy the **contents** of this folder at the existing Performance Powerhouse site root.

Required routes/files:
- `/index.html`
- `/community-share.html`
- `/manifest.webmanifest`
- `/sw.js`
- `/icon-192.png`
- `/icon-512.png`
- `/physics-intelligence/index.html`
- `/physics-intelligence/styles.css`
- `/physics-intelligence/app.js`
- `/physics-intelligence/favicon.svg`
- `/physics-intelligence/assets/physics-intelligence-data.json`

Community/privacy-safe URLs after deployment:
- Main community/share view: `/community-share.html`
- Main app forced share-safe view: `/?share=1`
- Physics Intelligence share view: `/physics-intelligence/?share=1`

## Data-safety rule
Keep the same site origin when replacing the current live build so browser-local V3 data can be discovered and migrated into the V4 key. A completely different domain cannot read localStorage from the old origin; use JSON export/import for domain moves.

Do not rename these storage keys:
- Main V4: `al_performance_powerhouse_v4`
- Previous Powerhouse migration source: `al_performance_powerhouse_v3`
- Physics Intelligence: `al_performance_powerhouse_physics_intelligence_v1`
