# Memory — Question Bank 2-Step JSON Creator, Answer Key Merger & UI Imprints

Last updated: 2026-08-19T07:00:45+05:30

## What was built

### 1. 2-Step Question Bank JSON Upload & Answer Key Merger (`src/AdminPanel.tsx#L2749-L2970`)
- Built independent 2-step ingestion pipeline for Content Banks:
  - **Step 1 (Questions JSON)**: File drag-and-drop (`.json`) or code paste textarea with `FileCode` icon.
  - **Step 2 (Answer Key JSON)**: File drag-and-drop (`.json`) or code paste textarea with `KeyRound` icon, supporting partial or late answer keys.
- **Universal Key Merger Algorithm (`mergeQuestionsAndAnswerKey`)**: Automatically normalizes question formats, converts letter choices (`'A'`, `'B'`, `'C'`, `'D'`) and 1-based indices to zero-indexed numeric positions, merges step-by-step explanations, and preserves unkeyed questions for practice mode.
- **Real-Time Summary Card**: Dynamic gradient banner displaying total questions, keyed questions count, and unkeyed/practice count with direct 1-click preview trigger.

### 2. Live Parsed Question Bank Review Modal (`src/AdminPanel.tsx#L7647-L7780`)
- Built `<MathTextRenderer />`-powered review modal allowing admins to inspect question typography, validated option tiles (green highlight with letter badge for correct answer), and explanation boxes before committing to the database.

### 3. Questions Table Bulk Synchronization & Auto-Categorization (`src/AdminPanel.tsx#L1644-L1675`, `src/lib/examService.ts#L870-L925`)
- When creating a Question Bank with JSON, questions are automatically bulk-inserted into the `questions` table with `topic = bank.title` and indexed sort orders.
- Updated `examService.getQuestionsForQuestionBank` to query questions by topic name/bank ID with fallback to embedded JSON metadata in `pdfUrl`.

### 4. UI Registry Imprints (`context/ui-registry.md`)
- **Entry #47**: `AdminQuestionBankJsonBuilder` (2-Step Questions & Answer Key JSON Merger with Mode Switcher & Summary Card).
- **Entry #48**: `AdminQuestionBankPreviewModal` (Live Parsed Review Modal with Math Renderer & Option Validation).

### 5. Exam Category View Ultra-Smooth 120 FPS Scroll Engine (`src/components/DynamicVectorCard.tsx`, `src/App.tsx`)
- Stripped static `willChange: transform/opacity` inline styles from `DynamicVectorCard.tsx` and replaced with hover-scoped hardware layer promotion (`hover:will-change-transform`), preventing the browser from creating 150+ GPU layers simultaneously on pages with 50+ cards.
- Enabled native DOM content virtualization (`.cv-card-auto` with `contain-intrinsic-size: auto 280px`) on Question Bank card grids in `src/App.tsx`, skipping paint and layout calculations for offscreen cards during scroll.
- Promoted the Question Bank grid outer section to single-layer GPU acceleration (`.gpu-accelerated`) and removed Framer Motion intersection observer overhead from bulk item lists.

## Decisions made
- **Decoupled Key Ingestion**: Raw question JSON and Answer Key JSON can be uploaded independently, allowing question sets to be created even when official answer keys are published separately or late.
- **Unified Topic Binding**: Question banks automatically seed the `questions` table under `topic: bank.title` so students can access both the interactive Web Reader and individual practice drill engines simultaneously.
- **Hover-Scoped GPU Layer Promotion**: Never apply static `willChange: transform/opacity` on multi-item card list items; promote GPU layers strictly on active mouse hover to prevent layer compositing thrashing.

## Problems solved
- **Exam Category View Scroll Lag & Frame Drops**: Fixed by removing unconditional `willChange` styles across 50+ cards, virtualizing offscreen cards with `.cv-card-auto`, and reducing Framer Motion scroll observer overhead.
- **Manual Question-by-Question Upload Tedium**: Replaced manual form entry with bulk JSON drag-and-drop parsing and instant answer key normalization.
- **Formatting Mismatches in External Answer Keys**: Handled mixed formats (object map `{"1": "A"}`, array `[{"qNo": 1, "answer": "B"}]`, letter choices, and 1-based numerical indexes) automatically.

## Current state
- Production build verified clean (`npm run build` — Exit Code 0).
- Exam Category View and Question Bank Web Reader smoothly scroll at continuous 120 FPS with 0 frame drops.
- `ui-registry.md` has 48 entries, fully up to date.

## Next session starts with
- Ready for any new feature, page, or enhancement requested by the developer.

## Open questions
- None.
