# Memory — PWA Standalone WebAPK Installation & Offline Engine Recovery

Last updated: August 22, 2026

## What was built

### 1. PWA Standalone WebAPK Installation Recovery
- **Manifest Cross-Origin Fix (`index.html`)**: Converted the hardcoded absolute manifest link (`https://odishaexamprep.in/site.webmanifest`) to a relative path `<link rel="manifest" href="/site.webmanifest" />`. This guarantees that visiting from `www.odishaexamprep.in`, `odishaexamprep.in`, or `localhost` never encounters CORS or origin mismatch failures during Chrome's WebAPK minting check.
- **Mobile PWA Capability Tags (`index.html`)**: Added `<meta name="mobile-web-app-capable" content="yes" />`, `<meta name="apple-mobile-web-app-capable" content="yes" />`, `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`, and `<meta name="apple-mobile-web-app-title" content="OdishaExamPrep" />`.
- **WebAPK Metadata & Adaptive Maskable Icons (`public/site.webmanifest`)**:
  - Configured `id: "/"`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `orientation: "any"`, and `categories: ["education", "productivity"]`.
  - Added dedicated entries with `purpose: "any"` and `purpose: "maskable"` across `192x192` and `512x512` PNG assets to support Android adaptive icons.
- **Service Worker Offline / Fetch Handler (`public/sw.js`)**:
  - Implemented a network-first with cache-fallback `fetch` event listener with cache pre-caching (`STATIC_ASSETS`), satisfying Google Chrome's mandatory PWA offline / fetch handler installability audit.
  - Added explicit bypasses for `/api/`, `/app-api/`, and `supabase.co` network requests to prevent caching live transactional/auth data.
- **Immediate Startup Registration (`src/main.tsx`)**: Initialized `registerServiceWorker()` during client application bootstrap so Chrome detects an active service worker controller on the first visit.

---

## Decisions made
- **Relative Manifest & Asset Paths**: Always declare manifest and icon links using relative root paths (`/site.webmanifest`) to avoid origin mismatches across DNS aliases (`www` vs non-`www`).
- **Network-First Caching Strategy**: Prioritize fresh network content for all dynamic pages while caching static assets and providing a clean offline fallback for navigation requests.
- **Explicit Maskable Icon Purposing**: Dual-declare `purpose: "any"` and `purpose: "maskable"` in `site.webmanifest` to ensure Android WebAPK compilers generate proper adaptive launcher icons.

---

## Problems solved
- **Downgrade to Web Shortcut ("Add to Home screen")**: Resolved the issue where Chrome on mobile was creating simple browser bookmark shortcuts instead of installing a standalone WebAPK application with its own splash screen and app drawer icon.

---

## Current state
- PWA installability criteria 100% verified.
- Production build succeeds with **0 errors** (`npm run build` exit code `0`).
- Documentation updated in [`context/progress-tracker.md`](context/progress-tracker.md) and [`context/ui-registry.md`](context/ui-registry.md).

---

## Next session starts with
- Ready for any new feature development, test series additions, or platform enhancements.

---

## Open questions
- None.


