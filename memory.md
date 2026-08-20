# Memory — Mobile Touch Scrolling Fixes, Admin CTA Subtitle Dropdown & Global Deletion Cache Invalidation

Last updated: 2026-08-20T09:55:40+05:30

## What was built

### 1. Directional Touch Gesture Tracking & Horizontal Track Scroll Unlock
- **`src/components/YouTubeCarousel.tsx`**: Re-engineered touch handling to track drag delta distance on touchmove. When vertical swipe intent is detected (`Math.abs(deltaY) >= Math.abs(deltaX)`), touch dragging immediately unbinds and yields to native vertical document scrolling without calling `e.preventDefault()`. `e.preventDefault()` is only called during intentional horizontal carouselling.
- **Horizontal Scroll Containers & Pill Rows**: Removed restrictive `touch-pan-x` and `overscroll-contain` classes across:
  - `src/App.tsx`: Continue Practice slider, Recent Activity slider, History filter tabs, Syllabus exam switcher tabs, Sectional Mocks subject tab bar.
  - `src/pages/AiMentor.tsx`: Attachment tray and quiz suggestion chips.
  - `src/pages/BlogList.tsx`: Blog category filter bar.
  - `src/pages/CurrentAffairs.tsx`: Current affairs category filter bar.

### 2. Category-Matched CTA Subtitle Dropdown & Custom Input (`src/AdminPanel.tsx`)
- Created `CATEGORY_TAGLINE_PRESETS` in `AdminPanel.tsx` mapped to each practice/question bank category (`topic-wise`, `exam-focused`, `revision-sets`, `pyq-collections`, and generic popular CTAs).
- Replaced the raw input for **"Topic / Subject Subtitle"** in the Add/Edit Bank modal with a hybrid dropdown selector that dynamically updates its recommendations when the category is switched, allows instant 1-click CTA population, and reveals a custom text input with a `Clear` button for bespoke chapter titles.
- Imprinted `AdminTopicSubtitleSelector` into `context/ui-registry.md` (Entry 67).

### 3. Global Deletion & Cache Invalidation System (`src/lib/examService.ts`)
- Fixed the issue where deleted Question Banks, Mock Tests, and Test Series reappeared in the Admin Panel table after deletion.
- Added comprehensive dual-phase cache invalidation (`cacheService.clear`) across `deleteQuestionBank`, `updateQuestionBank`, `deleteMockTest`, `updateMockTest`, `deleteTestSeries`, `updateTestSeries`, `deleteExam`, `updateExam`, `deleteQuestion`, and `updateQuestion`.
- Added strict `.filter(item => !item.is_archived)` filtering on `getAllQuestionBanks`, `getAllMockTestsLite`, `getAllTestSeries`, and `getAllExams` so archived/soft-deleted items are never returned to the UI on refresh.

## Decisions made

- **Touch Action Philosophy**: Inline horizontal rows inside vertically scrolling pages should never use `touch-pan-x` (`touch-action: pan-x;`), because CSS specifications dictate that `pan-x` disables all vertical panning gestures starting on child cards. Relying on default `touch-action: auto` with CSS `overscroll-behavior-x: contain` preserves horizontal swipe while allowing full vertical page scroll freedom.
- **Dual Cache Invalidation on Mutations**: Any write operation (create, update, single delete, bulk delete) must clear all parent and dependent catalog caches immediately before and after DB operations to guarantee that subsequent `fetchData()` calls retrieve fresh data from Supabase.
- **Archival/Soft-Delete Isolation**: Items with active user purchases are marked `is_archived: true` to protect paid student access while being filtered out from all active admin lists and active catalog selectors.

## Problems solved

- **Mobile Page Scroll Lock on Cards**: Resolved touch event interception by YouTube Carousel and slider cards that previously forced mobile users to scroll from the screen margins.
- **Deleted Items Reappearing After Alert**: Resolved stale memory cache returning deleted question banks upon `fetchData()`.

## Current state

- Production build passing cleanly with **0 TypeScript and 0 JSX errors** (`npm run build` exits with code 0).
- All documentation updated (`context/progress-tracker.md`, `context/ui-registry.md`).
- Mobile touch scrolling and admin deletions working reliably across all devices and browsers.

## Next session starts with

- Continue with any new features, content additions, or student dashboard enhancements requested by the developer.

## Open questions

- None at this time. All reported issues are fully resolved and verified.
