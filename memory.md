# Memory — Home Tab Vector Upgrade & Global Mouse Tracking Engine (v7.3.0)

Last updated: 2026-08-15T20:40:30+05:30

## What was built

### 1. Home Tab Edge-to-Edge Vector Canvas & Vector Cards (`src/App.tsx`)
- **Full Vector Background Canvas:** Added full-viewport dot-matrix grid canvas (`bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:20px_20px]`), ambient blur orbs, and rotating vector watermarks (`GraduationCap`, `BookOpen`, `Award`, `Compass`).
- **Vector Card Conversions:** Converted **Continue Practice**, **Recent Activity**, and **Explore Exams** (mobile rows & desktop grid cards) into vector cards wrapped with `<DynamicVectorCard>` and inner vector dot-matrix overlays (`bg-[radial-gradient(#cbd5e1_1px,transparent_1px)]`).

### 2. Complete Dark Mode Color Refinement (`src/App.tsx` & `src/components/YouTubeCarousel.tsx`)
- **YouTube Strategy Videos Card:** Added outer container dark styles (`dark:bg-slate-900 dark:border-slate-700`), dynamic edge fade gradient masks (`#0f172a` in dark mode), and dark card backgrounds (`dark:bg-slate-800`).
- **Continue Practice & Recent Activity:** Upgraded section headings, scroll buttons, text colors, progress bar tracks, and score pills (`emerald`, `amber`, `red`, `slate`) for dark mode.
- **Explore Exams Controls & Cards:** Fixed upcoming/popular control tab pills (`dark:bg-slate-800/60`, `dark:text-slate-300`). Replaced metallic gray dark card backgrounds with a rich deep navy blue gradient (`from-[#0d1b3e] via-[#0f2257] to-[#0b1730]`).

### 3. Site-Wide Ambient Mouse Tracking & Vector Cursor System (`MouseTrackingCanvas.tsx`, `VectorCursorFollower.tsx`, `DynamicVectorCard.tsx`)
- **Ambient Light Canvas (`MouseTrackingCanvas.tsx`):** 60fps lerp-interpolated background canvas rendering a subtle ambient glow orb following viewport mouse position across all pages.
- **Interactive Cursor Follower (`VectorCursorFollower.tsx`):** Precision center dot and expandable interactive ring follower detecting buttons, links, cards, and interactive elements (`1.45x` scale expansion on hover).
- **3D Magnetic Card Parallax (`DynamicVectorCard.tsx`):** Added 3D perspective magnetic tilt (`transform: perspective(1000px) rotateX(...) rotateY(...)`), top-layer surface spotlight (`z-20`), and cursor edge illumination ring (`z-30`).

### 4. Full-Width Executive Header Navigation (`src/App.tsx`)
- **Full-Width Layout Upgrade:** Updated inner top navbar container from rigid `max-w-7xl` to edge-to-edge `w-full px-4 sm:px-6 lg:px-8` layout so logo and controls anchor cleanly to far screen edges on wide monitors.

### 5. Design System & UI Registry Imprints (`context/ui-registry.md` & `context/progress-tracker.md`)
- Imprinted visual patterns for `TopHeaderNavigation`, `DynamicVectorCard`, `MouseTrackingCanvas`, and `VectorCursorFollower` in `context/ui-registry.md`.
- Updated `context/progress-tracker.md` with completion status for all components.

## Decisions made
- **Top-Layer Surface & Edge Spotlight (`z-20` / `z-30`):** Surface spotlight and edge illumination ring in `DynamicVectorCard` are placed above `{children}` so cursor tracking remains visible over opaque card backgrounds.
- **Full-Width Header Container:** Top navigation bar uses `w-full px-4 sm:px-6 lg:px-8` edge-to-edge styling across all routes.
- **Defensive Device Guards:** Mouse tracking canvas and cursor follower automatically disable on touch devices (`pointer: coarse`) to preserve mobile battery and performance.

## Problems solved
- **Hidden Card Mouse Spotlight:** Solved issue where card backgrounds obscured mouse spotlights by elevating spotlight layers (`z-20` / `z-30`) above children content.
- **Dark Mode Metallic Gray Card Fix:** Replaced flat metallic gray exam cards with a rich deep navy blue gradient (`#0d1b3e` to `#0b1730`) with high-contrast text styling.
- **Dark Mode Pill Inconsistency:** Fixed light-mode behavior on upcoming/popular exam pills in dark mode.

## Current state
- Clean build verified (0 TypeScript errors).
- All changes committed and pushed to GitHub main branch (`https://github.com/Pixduct/OdishaExamPrepNew.git`).

## Next session starts with
- Assist the user with any new feature requests, page layout updates, or administrative enhancements.

## Open questions
- None.
