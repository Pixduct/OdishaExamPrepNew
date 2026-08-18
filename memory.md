# Memory — DynamicVectorCard Borderless Elevation & Overflow Clipping Resolution

Last updated: 2026-08-18T21:13:30+05:30

## What was built

### 1. DynamicVectorCard Borderless Elevation Engine (`src/components/DynamicVectorCard.tsx`)
- Stripped Layer D (`rimRef`) 1px mask composite border layer (`maskComposite: 'exclude'`), eliminating static 1px border lines and halo box outlines around cards.
- Calibrated ambient radial gradient falloff to `radius: 300px` (light) / `360px` (dark) with stops `0% core → 30% mid → 60% transparent`. Light reaches 0.000 alpha inside the card footprint, mathematically preventing rectangular edge clipping lines.
- Fixed Tailwind hover selector variant from `[.is-card-hovered_&]` to `[&.is-card-hovered]`, ensuring 3D perspective tilt and scale trigger smoothly on card hover.

### 2. Standardized Borderless Card Design Across All Hub Cards
- Removed static `border border-white/20`, `border-white/10`, and `border-slate-200` classes across:
  - `src/App.tsx` (Guided Recommendation Hero, Step 1 Practice Tests, Step 2 Mock Tests, Step 3 Reference Library)
  - `src/components/AIStudyPlanCard.tsx`
  - `src/components/ExamReadinessCard.tsx`
  - `src/components/SmartRecommendationCard.tsx`
  - `src/components/PersonalBestCard.tsx`
  - `src/components/TopicConfidenceMatrix.tsx`
- Replaced rigid border lines with soft elevation shadow tokens (`shadow-xl shadow-slate-900/10 dark:shadow-slate-950/30` / `hover:shadow-2xl`).

### 3. Root Viewport Overflow & Grid Negative Margin Resolution (`src/App.tsx`)
- Removed `overflow-x-hidden` from all 4 `DashboardContent` root container instances (`lines 492, 534, 8107, 9107`), which was the root cause of cards getting sliced on the right edge.
- Removed `p-1.5 -m-1.5` negative margins from the Step 1 Practice Tests grid container and set explicit `relative w-full h-full min-h-full` sizing.

### 4. UI Registry & Progress Tracker Imprints (`context/ui-registry.md`, `context/progress-tracker.md`)
- Updated Entry #41 with the complete Borderless Elevation & Viewport Overflow Protection pattern specifications.

## Decisions made
- **Borderless Elevation Over Rigid 1px Strokes**: Rely on ambient light backlighting and multi-layer elevation shadows rather than 1px border lines on dark/glass cards over light canvas backgrounds.
- **Top-Level Root Viewport Isolation**: Keep `overflow-x: hidden` strictly on `html, body` in `index.css`. Inner page containers must not use `overflow-x-hidden` to avoid clipping 3D hover scale transformations.
- **Zero-Alpha Edge Rule**: Dynamic cursor lighting layers must fade to `transparent` at ≤60% of radius so no non-zero alpha pixels contact `inset: 0` bounding boxes.

## Problems solved
- **Card Right-Edge & Corner Slicing**: Fixed by removing `overflow-x-hidden` on `DashboardContent` root divs and removing `-m-1.5` negative margins.
- **1px Border Line & Rectangular Halo Edge**: Fixed by removing `rimRef` mask layer and recalibrating radial gradient stops in `DynamicVectorCard.tsx`.
- **Card Hover Selector Inaction**: Fixed by updating the Tailwind selector variant to `[&.is-card-hovered]`.

## Current state
- TypeScript builds cleanly (`npx tsc --noEmit` — 0 errors).
- All cards float 100% borderless with clean rounded corners and smooth 3D hover lighting across all screen sizes.
- `ui-registry.md` and `progress-tracker.md` are up to date.

## Next session starts with
- Ready for any new feature, page, or UI refinement requested by the developer.

## Open questions
- None.
