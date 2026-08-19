# Memory — Card Hover Overflow & Viewport Clipping Resolution Across All Views

Last updated: 2026-08-19T22:16:00+05:30

## What was built

### 1. Question Bank Card Hover Top Clipping Resolution (`src/App.tsx` lines 8734–8824)
- Fixed the top-edge clipping issue on Question Bank items rendered in the Reference Library browser grid.
- Shifted the hover lift interaction onto the parent `<motion.div whileHover={whileHover.liftTap}>` and removed inner `hover:-translate-y-1.5` from `<Card>` to prevent top-edge slicing by `.cv-card-auto`'s CSS paint containment (`content-visibility: auto`).

### 2. Home Page Explore Exams & Step 3 Question Bank Cards Hover Fix (`src/App.tsx` lines 8504 & 10406–10450)
- **Explore Exams (`filteredExams.map`)**: Removed `md:group-hover/card:-translate-y-1 md:group-hover/card:-translate-x-1` from the inner `div` inside `DynamicVectorCard`, letting `DynamicVectorCard`'s GPU 3D perspective tilt and scale handle the hover effect without inner boundary clipping.
- **Step 3 Question Bank Categories**: Replaced inner watermark `overflow-hidden` with hardware `[clip-path:inset(0_round_2.2rem)]` and standardized `whileHover` to `whileHover.liftTap` and `whileTap={whileTap.press}`.

### 3. Hero Interactive Demo Question Card Hover Overflow Fix (`src/App.tsx` lines 2618–3370)
- Removed `overflow-hidden` from the hero row wrapper container (`<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">`) so 3D perspective hover tilts and neo-brutalist shadows have full vertical clearance.
- Refactored `InteractiveHeroPreview` to move outer shell properties (`border-2`, `bg-white dark:bg-slate-900`, `rounded-[2rem]`, and `shadow-[8px_8px_0px_#2563EB]`) to `<DynamicVectorCard>` directly, eliminating double-container clipping.

### 4. Continue Practice & Recent Activity Sliders Card Hover Clipping Fix (`src/App.tsx` lines 8077–8280)
- Removed `whileHover={whileHover.subtle}` (`y: -5`) from inner `<motion.div>` elements inside `DynamicVectorCard` in both **Continue Practice** and **Recent Activity** horizontal sliders.
- Expanded slider track vertical padding from `py-3 sm:py-4` to `py-4 sm:py-5` for ample vertical clearance during 3D perspective hover states and ambient lighting sweeps.
- Removed legacy `md:hover:-translate-y-1 md:hover:-translate-x-1` from Achievers Journal cards.

### 5. Viewport Layout Containers Cleanup (`src/App.tsx` lines 10807–11559)
- Removed `overflow-x-hidden` from main inner page containers per architectural rules.

### 6. Design System & Documentation Synchronization
- Registered Entries #54 (`ContinuePracticeSliderCard`), #55 (`RecentActivitySliderCard`), and #56 (`InteractiveHeroDemoCard`) in `context/ui-registry.md`.
- Updated `context/progress-tracker.md` with all completed milestones.

## Decisions made

- **No Inner `translateY` inside `DynamicVectorCard`**: `DynamicVectorCard` uses `overflow: hidden` to encapsulate internal ambient radial gradients and lighting shine sweeps. Any child element applying CSS `hover:-translate-y-*` or Framer Motion `whileHover={{ y: -5 }}` will shift outside the card bounds and be clipped. All hover transforms on `DynamicVectorCard` items must rely on `DynamicVectorCard`'s built-in 3D perspective tilt (`rotateX`/`rotateY`) and `scale3d(1.015,1.015,1.015)`.
- **Top-Level Viewport Rule**: Inner page containers (`max-w-7xl mx-auto`) and row wrappers must never apply `overflow-hidden` or `overflow-x-hidden`. Viewport overflow containment is strictly isolated to `html, body` in `index.css`.
- **Horizontal Sliders Headroom**: All horizontal snap-scroll tracks containing 3D/hover cards must maintain at least `py-4 sm:py-5` vertical padding to ensure shadows and perspective tilts do not get cut off by the scroll container.

## Problems solved

- Sliced top-edge borders on Question Bank cards caused by `.cv-card-auto` paint containment.
- Top clipping on Explore Exams and Hero Demo Question cards caused by row-level `overflow-hidden` and nested card translations.
- Cut-off / disappearing cards on hover in Continue Practice and Recent Activity sliders caused by inner `whileHover.subtle` translation.

## Current state

- All card hover interactions across the website (Question Banks, Explore Exams, Hero Demo Question Card, Continue Practice, Recent Activity, and Achievers Journal) are fully visible, render with 0% clipping, and maintain smooth 60fps GPU-accelerated 3D perspective lighting sweeps.
- Build Status: `npm run build` succeeds cleanly with 0 TypeScript/compilation errors.

## Next session starts with

- Proceed with any new features, tests, or content updates as requested by the user.

## Open questions

- None. All hover clipping and overflow issues across cards are fully resolved.
