# Memory — Admin Question Bank & Practice Mode Full Decoupling, Safe Deletion & Mode Isolation

Last updated: August 21, 2026

## What was built

### 1. Top-Level Decoupled Navigation & Tab Views (`src/AdminPanel.tsx`)
- Added **`Practice Sets`** (🎯) alongside **`Question Banks`** (📦) as independent top-level navigation tabs.
- Filtered item lists and exam drilldown counters so `Question Banks` tab strictly displays items with `(target_mode || 'both') !== 'practice'` and `Practice Sets` tab strictly displays items with `(target_mode || 'both') !== 'bank'`.
- Independent search bars, exam dropdown filters, and category hierarchy pill selectors for both tabs.

### 2. Tailored Creation & Edit Modal Forms (`src/AdminPanel.tsx`)
- **Question Banks Form (`activeTab === 'banks'`):**
  - Displays amber guidance banner (*"📦 Question Bank (Step 3) — Interactive web reader & PDF downloads for students"*).
  - Shows custom PDF download links, cover image URLs, and Question Bank category presets (`Topic-Wise Question Bank`, `Exam-Focused Bank`, `Revision Sets`, `PYQ Collections`).
  - Defaults strictly to `target_mode: 'bank'`.
- **Practice Sets Form (`activeTab === 'practice'`):**
  - Displays blue guidance banner (*"🎯 Practice Set (Step 1) — Interactive CBT drills with instant timer and answer explanations"*).
  - Renders clean, distraction-free CBT test creation form (hides PDF links and cover image inputs).
  - Displays Practice category presets (`Chapter-Wise Practice`, `High-Yield Topic Banks`, `Daily Speed Quizzes`, `Topic-Wise PYQs`).
  - Defaults strictly to `target_mode: 'practice'`.

### 3. Non-Destructive Safe Deletion Engine (`src/AdminPanel.tsx`, `src/lib/examService.ts`)
- **Admin Panel Safe Downgrade**: Deleting an item with legacy `target_mode === 'both'` from the `Practice Sets` tab now safely updates `target_mode = 'bank'`, preserving the Question Bank and its PDFs completely. Deleting from `Question Banks` tab updates `target_mode = 'practice'`.
- **Backend Co-existence Guard (`src/lib/examService.ts#deleteQuestionBank`)**: Before deleting questions associated with a deleted bank/practice set from the `questions` table, it checks if any other Question Bank or Practice Set shares that topic (`title` and `examId`). If a co-existing bank exists, question deletion is skipped, ensuring zero data loss.

### 4. Memory & Documentation Sync
- Imprinted **`AdminDecoupledContentModal`** (Item 90) in `context/ui-registry.md`.
- Updated `context/progress-tracker.md`.

---

## Decisions made
- **Decoupled User Experience on Unified Schema**: Maintained database schema consistency (`public.questionBanks` with `target_mode: 'bank' | 'practice' | 'both'`) while providing a 100% decoupled, isolated admin experience for Question Banks and Practice Sets.
- **Safe Downgrade over Hard Delete**: Transitioning legacy combined items into single-mode items on delete rather than wiping the database row.
- **Topic Co-Existence Preservation**: Ensured `questions` table rows are guarded if multiple entities reference the same topic title.

---

## Problems solved
- **Data Loss on Practice Test Deletion**: Eliminated the critical issue where deleting a practice test inadvertently deleted the Question Bank, removed attached PDF links, and purged questions from the database.
- **Sticky Form Modal Bleed**: Fixed sticky session memory bleed where opening `+ Add New Question Bank` was pre-selecting Practice Mode from prior sessions.
- **Subject Tag Clarity**: Clarified that the `Select Subject` dropdown assigns category tagging for student frontend filtering and does not create destructive hard foreign-key locks.

---

## Current state
- Fully tested and verified with `npm run build` passing cleanly with 0 errors (exit code `0`).
- Both Question Banks and Practice Sets operate with complete independence for adding, editing, and deleting.

---

## Next session starts with
- Ready for any new feature requests, content additions, or student-facing enhancements.

---

## Open questions
- None. All requested decoupling features and safeguards are fully implemented and verified.

