# Memory — YouTube Carousel Admin Visibility Toggle & Hard-Reload Persistence Architecture

Last updated: September 30, 2026, 11:45 IST

## What was built

1. **Automated Platform Invariant & Regression Scanner (`scripts/verify-invariants.ts`, `context/invariants.md`, `package.json`)**:
   - Built a high-performance (~180ms) static invariant scanner asserting 25 non-negotiable architectural pillars (bottom navigation universal visibility, zero `md:hidden` responsive hiding, defensive component fallbacks, full-screen vector backgrounds, and route mapping).
   - Chained scanner directly into `npm run build` and `npm run lint`. Configured explainable terminal diagnostic alerts that halt the build with exit code 1 if any invariant is violated.

2. **Admin Control Center YouTube Carousel Visibility Toggle (`src/AdminPanel.tsx`)**:
   - Integrated an interactive toggle switch inside the "YouTube Carousel Integration" card in Admin Settings.
   - Built with instant auto-save directly to Supabase via `examService.updateExam` using authenticated `callAdminDbProxy`.
   - Real-time visual feedback badge (`Saving...` → `Saved: Live on Home` / `Saved: Hidden from Home`) with emerald active beacon and slate hidden indicator.
   - Defensive error handling with automatic UI and cache rollback upon network failure.

3. **Hard-Reload Persistence Architecture (`src/lib/examService.ts`)**:
   - Resolved the root cause of settings resetting on browser refresh (F5): updated `getAllExams()` filter in `src/lib/examService.ts` to allow `SYSTEM_SETTINGS_*` records to pass through alongside authentic competitive exams instead of being stripped by `isAuthenticExam`.
   - Student dashboard views continue to filter out `SYSTEM_SETTINGS_*` via `exam.name.startsWith('SYSTEM_SETTINGS_')`, preventing system settings from displaying as exam cards.

4. **Zero-Lag Cross-Route Cache Synchronization (`src/App.tsx`)**:
   - Resolved SPA cache drift: registered a global module-level `oep_catalog_updated` event listener on `_dashboardCache` so that administrative catalog changes immediately clear module-level in-memory cache even while `DashboardContent` is unmounted.
   - Added synchronous 0ms `sessionStorage` fallback (`oep_youtube_carousel_enabled`) in both `AdminPanel.tsx` and `src/App.tsx` to eliminate transitional layout shifts or flicker when navigating between admin and student routes.

5. **Supabase Database Deduplication**:
   - Archived duplicate settings row in Supabase and anchored all future updates to authoritative record `dc564cf2-00e2-42ed-8421-c52aefbf188a`, permanently preventing duplicate settings records.

6. **Documentation & UI Imprint**:
   - Documented the component pattern in `ui-registry.md` and `context/ui-registry.md` (`AdminYouTubeCarouselToggle`).
   - Logged completed tasks in `progress-tracker.md` and `context/progress-tracker.md`.

## Decisions made

- **System Settings Pipeline Preservation**: `examService.getAllExams()` must preserve `SYSTEM_SETTINGS_*` records while filtering student exams at the view level (`exam.name.startsWith('SYSTEM_SETTINGS_')`).
- **Instant Auto-Save for Administrative Toggles**: Standalone visibility switches auto-save immediately to Supabase and trigger `clearCatalogCache()` without requiring separate form submission buttons.
- **Multi-Layer SWR Synchronization**: Combines synchronous `sessionStorage` for instant 0ms local UI transitions with Supabase DB persistence and `oep_catalog_updated` events for global cross-client synchronization.
- **Non-Destructive Invariant Enforcement**: Invariant checks run strictly in dev and build time with zero client runtime overhead.

## Problems solved

- **YouTube Carousel Disappearing Without User Instruction**: Added defensive `DEFAULT_FALLBACK_VIDEO_IDS` in `src/components/YouTubeCarousel.tsx` to guarantee the carousel never returns `null` when custom database IDs are unpopulated.
- **Bottom Navigation Hidden on Desktop**: Removed `md:hidden` across bottom navigation docks in `src/App.tsx` and protected universal visibility with automated Invariant #1.
- **Toggle Not Persisting on Refresh**: Resolved by updating the `getAllExams` filter in `src/lib/examService.ts` to include `SYSTEM_SETTINGS_YOUTUBE_RESERVED`, ensuring `isYoutubeEnabled` correctly evaluates `false` on hard reload.
- **Duplicate Records in Supabase**: Removed duplicate rows and anchored updates to the primary settings ID.

## Current state

- All 25/25 platform invariants passing cleanly (`npm run test:invariants`, ~177ms).
- Zero TypeScript compiler errors (`npx tsc --noEmit`).
- Production bundles compiled and verified (`npm run build`, `build/server.js 327.6kb`).
- YouTube carousel visibility toggle is live, auto-saves instantly, and persists reliably across hard browser reloads.

## Next session starts with

- Run `/remember restore` to reload this verified state.
- Proceed with any new features, UI refinements, or administrative controls requested by the user.

## Open questions

- None. Everything requested is implemented, verified, and operational.
