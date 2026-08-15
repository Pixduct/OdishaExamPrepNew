# Memory — Executive 3D Vector Cards & Full-Screen Academic Canvas Engine (v6.0.0)

Last updated: 2026-08-15T08:46:40+05:30

## What was built

### 1. 1:1 Pixel Crisp Dynamic Cursor Spotlight Card Engine (`src/components/DynamicVectorCard.tsx`)
- **Real-Time Cursor Tracking**: Built reusable `<DynamicVectorCard>` component in `src/components/DynamicVectorCard.tsx` calculating exact mouse percentage coordinates (`posX`, `posY`) to drive real-time cursor reflection spotlights (`radial-gradient`).
- **Spotlight z-Index Isolation (`z-[1]`)**: Isolated cursor reflection spotlight to `z-[1]` layer (under content `z-10`, above card background `z-0`) with `mix-blend-soft-light` and soft ambient glow opacity (`rgba(59, 130, 246, 0.08)`), eliminating top-corner diagonal glare line washouts.
- **Unified Vector Border Radius (`rounded-3xl sm:rounded-[2.5rem]`)**: Applied explicit `rounded-3xl sm:rounded-[2.5rem]` across root containers and child card `<motion.div>` elements, eliminating subpixel parent clip-path border collisions and ensuring 100% smooth, anti-aliased vector corner curves.

### 2. Full-Screen Edge-to-Edge Academic Vector Canvas (`src/StudyPlanView.tsx` & `src/AnalyticsView.tsx`)
- **Viewport Canvas Spanning**: Structured `StudyPlanView.tsx` and `AnalyticsView.tsx` with full-screen edge-to-edge page canvases (`relative w-full min-h-screen bg-[#F8FAFC] overflow-x-hidden`).
- **Fixed Geometric Dot Grid**: Grid matrix uses `fixed inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-40`, spanning 100% of the viewport behind all hub cards without side margins.
- **Fixed Floating Vector Watermarks**: Positioned floating study vector watermarks (`GraduationCap`, `Calendar`, `Trophy`, `TrendingUp`, `Activity`, `Brain`) at `fixed inset-0` viewport edges.

### 3. Analytics Tab Executive 3D Vector Cards & Modal Upgrades (`src/AnalyticsView.tsx`)
- **Executive Card Transformations**: Converted `ExamReadinessCard`, `StatCard` (4 metrics), `AI Performance Lab`, `Performance Trend Card`, `Accuracy Breakdown Card`, `Overall Skill Profile Card`, `Performance Breakdown Card`, and `SubjectRow` cards into Executive 3D Vector Cards wrapped in `<DynamicVectorCard>`.
- **Niche-Aligned Vector Background Watermark Logos**: Assigned unique watermark logos matching each card's niche:
  - `Average Score`: `<Zap className="w-36 h-36 opacity-15 text-slate-300" />`
  - `Accuracy`: `<Target className="w-36 h-36 opacity-15 text-slate-300" />`
  - `Time per Question`: `<Timer className="w-36 h-36 opacity-15 text-slate-300" />`
  - `Total Attempts`: `<History className="w-36 h-36 opacity-15 text-slate-300" />`
- **Active Exam Context Bar & Modal**: Upgraded `ActiveExamContextBar.tsx` and `ExamContextSelectorModal.tsx` into Executive Dark Vector Cards with radial grid watermarks and floating 3D `Target` background icons.
- **Readiness Detail Modal**: Transformed `ReadinessDetailModal.tsx` into an Executive Dark Vector Card Modal featuring radial SVG score ring, live study audit banner, and 4 step progress cards.

### 4. Accessibility High-Contrast Text Upgrade
- **High-Contrast Text System**: Replaced low-contrast gray text across all cards with bright high-contrast typography (`text-white`, `text-amber-200/90`, `text-indigo-200/90`, `text-amber-300 font-mono font-black`).

### 5. UI Registry & Progress Tracker Imprints (`context/ui-registry.md` & `context/progress-tracker.md`)
- **Updated Section 47**: Imprinted `DynamicVectorCard` and `AcademicVectorCanvas` standard tokens, spotlight rules, and corner radius alignment standards.

## Decisions made
- **Subtle Spotlight Glow (`z-[1]`)**: Set cursor spotlight overlay to `z-[1]` under content with soft opacity (`0.08`) and `mix-blend-soft-light` to illuminate card backgrounds without painting over borders or text.
- **Full-Screen Canvas Viewport Spanning**: Page background canvases use `fixed inset-0` with `bg-[#F8FAFC]` to ensure consistent edge-to-edge canvas backgrounds across laptop screens.
- **Explicit Matching Border Radii**: Every card container and child `<motion.div>` explicitly declares `rounded-3xl sm:rounded-[2.5rem]` to avoid subpixel clipping collisions.

## Problems solved
- **Card Edge Clipping & Boxy Hover Edges**: Solved by removing root `overflow-hidden` from `DynamicVectorCard` and unifying parent/child border radius to `rounded-3xl sm:rounded-[2.5rem]`.
- **Top Corner Glare Washouts**: Resolved by lowering spotlight z-index from `z-30` to `z-[1]` and setting `glowColor` to `rgba(59, 130, 246, 0.08)`.
- **Study Hub Inset Canvas Gap**: Resolved by changing `StudyPlanView.tsx` root container to full-screen `fixed inset-0` vector dot grid matching `AnalyticsView.tsx`.
- **Low-Contrast Gray Reading Strain**: Resolved by upgrading low-contrast gray text to bright white, amber-gold, and indigo typography.

## Current state
- TypeScript Validation: `npx tsc --noEmit` passes with **0 errors**.
- Repositories: All website code committed and pushed to `Pixduct/OdishaExamPrepNew.git` (Latest commit `1a2a5f6`).
- Live Website: `https://www.odishaexamprep.in/` verified working cleanly.

## Next session starts with
- Assist the user with any new feature requests, card enhancements, administrative tools, or content updates.

## Open questions
- None.
