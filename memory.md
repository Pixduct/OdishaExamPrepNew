# Memory — Diagram Visual Anti-Clipping, Label Typography & Extreme Limits Hardening

Last updated: October 8, 2026, 10:48 IST

## What was built

1. **Universal Math & Reasoning Diagram Visual Anti-Clipping Engine (`src/components/UniversalMathDiagramEngine.tsx` & `src/lib/diagramValidator.ts`)**:
   - **High-Density Bar & Line Charts**: Implemented `isHighDensity` triggering `-48°` rotation (`textAnchor="end"`) and adaptive micro-typography (`text-[8px]` for categories, `text-[8.5px]` for values) whenever datasets contain $\ge 8$ points or category names $> 16$ characters.
   - **Dynamic Left Canvas Margin**: Dynamically expands Y-axis left margin via `dynamicLeftMargin = Math.min(95, 60 + (charLen - 3) * 7)` to prevent leading digits from being clipped by the SVG viewBox on large numbers.
   - **Compact Number Formatter (`formatCompactNumber`)**: Formats high-magnitude values using SI (`k`) and Indian notation (`L`, `Cr`), handling negatives, decimals, and clean integers under 10,000 without scientific notation or precision loss.
   - **Baseline Collision Elimination**: Automatically suppresses redundant numerical X-axis ticks when categorical bar/line charts are rendered, avoiding vertical collisions between names and numeric indices.
   - **Coincident Cyclic Displacement Offset**: Reasoning and physics paths returning to origin detect coincident start/end waypoints (`dist < 15px`), vertically offsetting `"Start"` to $y - 10$ and `"End"` to $y + 16$ (26px vertical separation with `[14, vHeight - 10]` viewport clamping).
   - **12-Person Seating Arrangement**: Introduced dynamic `chairScale = Math.max(0.72, 8/n)` and adaptive rounded pill geometries `<rect rx={chairH / 2}>` with `text-[8px]`, comfortably fitting 14-character names (e.g., *"Krushnachandra"*) with zero node overlap.
   - **12-Slice Pie Chart Hardening**: Desktop side-by-side layout ($x = 60\%$ to $98\%$) with micro-wedge ($<5\%$) interior text suppression to prevent central label clutter.

2. **Automated Verification Suites (160/160 Scenarios Passed at 100%)**:
   - `scratch/test_diagram_visual_labels_and_clipping.ts`: **40/40 PASSED (100%)**.
   - `scratch/test_extreme_diagram_limits_and_professional_rendering.ts`: **40/40 PASSED (100%)**.
   - `scratch/test_diagram_disambiguation_and_isolation.ts`: **80/80 PASSED (100%)**.

3. **Pattern Registration & Cross-File Parity**:
   - Imprinted `DiagramVisualAntiClippingEngine` into `ui-registry.md` and `context/ui-registry.md` (**100% SHA-256 byte match: `ce2c54d645827e0b802e69ee1cc7a60a9abec21a`**).
   - Updated `progress-tracker.md` and `context/progress-tracker.md` (**100% SHA-256 byte match: `dd32e52d495f6737e0645c36eb0ef979b5fb4922`**).

## Decisions made

- **Pure Validator Utility Placement**: Exported `formatCompactNumber` and numeric sanitizers from `src/lib/diagramValidator.ts` (re-exported by `UniversalMathDiagramEngine.tsx`) so pure Node CLI scripts and server processes can run validation without encountering KaTeX CSS module resolution errors.
- **Micro-Wedge Suppression Policy**: Wedges $<5\%$ in complex pie charts omit interior percentage text, delegating slice metrics entirely to the high-contrast right-hand legend to maintain a clean, professional aesthetic.
- **Coincident Waypoint Separation Policy**: When origin and terminal waypoints overlap in cyclical direction problems, the Start label is anchored above and the End label below with viewport edge clamping, eliminating overlapping text.

## Problems solved

- **Eliminated Leading-Digit Cutoff**: Fixed SVG margin clipping on 6+ figure and negative values by replacing fixed 60px margins with dynamic `dynamicLeftMargin`.
- **Eliminated Category Label Blurring**: Solved horizontal label overlap on dense 8+ item bar and line charts by combining `-48°` rotation with micro font scaling.
- **Eliminated Start/End Dot Occlusion**: Solved coincident point text collision on closed loop vector diagrams.
- **Eliminated KaTeX CSS Import Errors in CLI**: Re-factored helper utilities to allow standalone Node CLI execution.

## Current state

- **Platform Invariants**: **25/25 PASSED cleanly** (`npm run test:invariants` in 241ms).
- **Server Bundle**: Compiled cleanly in 179ms (`474.4kb` in `build/server.js`).
- **Client Production Build**: Compiled cleanly in 15.55s (`npm run build`, 0 errors).
- **Dual-File Parity**: 100% SHA-256 hash match on all dual-tracked files (`ui-registry.md`, `progress-tracker.md`).
- **Test Suites**: 160/160 diagram visual and stress tests passing at 100%.

## Next session starts with

- The diagram rendering engine and visual label anti-clipping architecture are fully hardened, tested, and documented.
- Ready to pick up next user priorities or any new exam generation / platform enhancements.

## Open questions

- None. All visual stress scenarios verified and green.
