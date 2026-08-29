# Memory — Questions Manager Hierarchy, Count Sync & Universal Responsive Data Table Engine

Last updated: August 29, 2026, 18:10 IST

## What was built

### 1. Questions Manager Subject Hierarchy & Filter Navigation (`src/AdminPanel.tsx`)
- **Subject Filter Bar**: Added horizontal subject pills (`🌟 All Subjects`, `📘 Arithmetic`, `📘 Data Interpretation`, `📘 General English`, `📘 GK & Current Affairs`, `📘 Reasoning`) mirroring the Practice Sets tab.
- **Grouped Subject Banners**: Question banks are organized under subject section banners (`🟦 ARITHMETIC (4 Sets)` with `Focus on Arithmetic →`).
- **Ascending Sort Ordering & Badges**: Cards are sorted strictly by `sortOrder` (`1, 2, 3, 4...`) with clean `#1`, `#2` order badges.

### 2. Elimination of Paginated Slice Bug & Real-Time Count Synchronization (`src/AdminPanel.tsx`, `server.ts`, `src/lib/examService.ts`)
- **Deleted `liveCount` Fallback**: Bank cards and modal selectors now exclusively evaluate `practiceQuestionCount`, `questionCount`, or embedded `questionsData` JSON lengths. They never truncate to client-side 50-item paginated question slices.
- **Server-Side Trigger on Bulk Upload**: `/api/admin/questions/bulk` endpoint runs `COUNT(*)` in Postgres and updates `questionBanks.questionCount` in the same transaction.
- **0ms Optimistic Updates & Cache Clearing**: Invalidation across memory cache (`all_question_banks`, `topic_counts`), `sessionStorage` (`oep_admin_catalog_cache_v2`), and optimistic React state incrementation.

### 3. Universal Question Data Table Engine & Mobile Touch Optimization (`src/components/MathTextRenderer.tsx`)
- **Separator-Less Markdown Parser**: Intelligently parses raw pipe-delimited data tables (e.g. `Year | Production | Export` / `Zone | Appeared | Passed`) even when questions omit explicit `---|---|---` separator lines.
- **Laptop / Desktop Layout**: Preserved full-width proportional column distribution (`md:table-fixed`, `md:px-6 md:py-3.5`).
- **Mobile Screen Optimization**: Eliminates vertical text/digit breaking (`VILL AGE`, `4 0 %`) using `whitespace-nowrap` on mobile viewports with native horizontal touch swiping (`overflow-x-auto rounded-2xl scrollbar-thin`) and a subtle `⇄ Scroll table horizontally` indicator.
- **KaTeX Cell Recursion**: Every individual cell is evaluated through `MathTextRenderer` for formulas and mathematical symbols.

### 4. UI Registries & Documentation
- Imprinted `AdminQuestionsBankHierarchyGrid` and `QuestionDataTableResponsiveRenderer` into `context/ui-registry.md`.
- Updated `context/progress-tracker.md` with all completed milestones.

---

## Decisions made
- **Server Aggregation Over Client Slices**: Never calculate aggregate catalog counts from client-side paginated tables in React; rely exclusively on database-level RPCs and synchronized table columns to guarantee Supabase egress efficiency (< 1.5 KB payload).
- **Responsive Table Hybrid Strategy**: Use `md:table-fixed` for proportional desktop layouts while using `whitespace-nowrap` with horizontal swipe on mobile viewports to prevent awkward word and number splitting.

---

## Problems solved
- **Solved 10-Question Display on 20-Question Banks**: Root cause was the 50-item pagination slice in React filtering questions from Page 1 only. Permanently fixed by removing `liveCount` and auto-syncing `questionBanks.questionCount` in Postgres.
- **Solved Missing Data Tables in Test Mode**: Raw pipe-separated DI questions now parse into styled HTML data tables with sapphire headers and alternating rows.
- **Solved Mobile Word Stacking**: Numbers and single-word headers no longer wrap vertically on small smartphone screens.

---

## Current state
- **Production Build**: Verified with `tsc --noEmit` (**0 errors**) and built with Vite + esbuild.
- **Git Repository**: All source code, build assets, and documentation pushed to `origin/main` (`ae66736`, `b354d9a`, `3621189`).
- **Admin Panel & Test Engine**: 100% operational, fast, and verified on desktop and mobile viewports.

---

## Next session starts with
- Ready for any new feature requests, administrative enhancements, or question content updates.

---

## Open questions
- None. All requested bug fixes, visual improvements, and mobile touch optimizations are completed and validated.
