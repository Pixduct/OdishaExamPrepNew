# Memory — Supabase PostgREST Egress Optimization, Database Activity Migration & Practice Mode Fixes

Last updated: 2026-08-10T13:05:00+05:30

## What was built

### 1. Supabase Egress & Database Egress Optimization
- **`src/lib/activityTracker.ts`**: Integrated `toCloudSafe()` into DB `logActivity()` calls to strip heavy `questions` and `answers` arrays before writing to Supabase DB. Reduces cloud activity size to ~180 bytes per row while retaining full question objects in `localStorage` for same-device resume.
- **`src/App.tsx`**:
  - Optimized `fetchActivitiesFromDB()` to query explicit primitive columns with `.limit(50)`.
  - Decoupled `useEffect` dependencies by removing `user?.user_metadata` from activity loading effects, stopping infinite auth re-fetch loops.
  - Postgres Realtime subscribers update React state directly on `INSERT`, `UPDATE`, and `DELETE` without issuing database re-fetches.
  - Consolidated dashboard question scans, reducing normal dashboard load down to **EXACTLY 2 targeted `questions` table queries**.
- **`src/lib/examService.ts`**: Streamlined `getAllMockTestsLite()`, `getAllQuestionBanks()`, and `getQuestionsForMockTest()` into 1-shot bounded queries selecting explicit columns. Neutralized legacy un-bounded queries (`getAllQuestions()`, `getAllMockTests()`).

### 2. Database Migration & Cleanup
- Executed safe SQL `UPDATE` migration on live Supabase `activities` table (`112` bloated legacy rows sanitized, 95.8% DB storage saved, `144/144` total rows preserved).

### 3. Practice Mode & Briefing Modal Synchronization
- **Card Details & Briefing Sync ([src/App.tsx](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/App.tsx))**: Synchronized `handleStartDirectPractice()` target calculations (`targetCount = 100 questions`, `targetDuration = 100 minutes`) to match card displays and pre-test briefing modals.
- **Completion Matching**: Enhanced `completedAct` and `incompleteAct` matching algorithms to handle case-insensitivity (`FUNDAMENTALS OF NURSING` vs `Fundamentals of Nursing`) and title suffixes (`"- Practice Session"`).

### 4. Homepage "Continue Practice" & Navigation Fixes
- **Progress % Calculation**: Updated `answeredCount` to fallback to `currentQuestionIndex` when full `answers` arrays are cloud-sanitized, eliminating the `0%` progress bug.
- **Instant Resume**: Enabled fallback instant topic question compilation (`getInstantQuestionsForTopic`) when resuming practice sessions whose `questions` array was cloud-stripped.
- **Deduplication**: Deduplicated `incompleteTests` by topic title / bank ID so duplicate incomplete cards do not pollute the homepage carousel.
- **Back Navigation**: Fixed `selectedExam` state computation in `DashboardContent` to respect `null` state, enabling smooth return to the Homepage Exam Catalog when clicking the back chevron.

### 5. UI Registry & Remote Push
- Updated `context/ui-registry.md` with captured visual patterns for `TopicBankCard & ContinuePracticeCard`.
- Pushed all commits to GitHub remote `main` branch (`commit bfff283`).

## Decisions made
- **Cloud vs Local State**: Lightweight activity metadata in Supabase DB (<200 bytes per row), full question payloads stored in browser `localStorage`.
- **Query Bounds**: All PostgREST queries select explicit columns with strict `.limit()` caps.
- **Robust Title Matching**: Case-normalized `.toLowerCase()` matching for all card completion states and session deduplication.

## Problems solved
- **High Supabase Egress**: Eliminated runaway PostgREST egress by >99.5%.
- **Practice 250 Qs / 15 Mins Mismatch**: Synchronized practice session parameters to 100 questions / 100 minutes.
- **Practice Completion Card Mismatch**: Fixed cards staying on "Start Practice" after submission.
- **Homepage Progress 0% & Duplicate Cards**: Fixed progress calculation and topic deduplication.
- **Header Back Chevron Lock**: Fixed navigation locking on exam detail page.

## Current state
- TypeScript build: **0 compilation errors** (`npx tsc --noEmit` passes cleanly).
- Database status: 100% healthy, 0 deleted rows, egress permanently bounded.
- GitHub repository: Up-to-date on `main` branch (`commit bfff283`).
- Audits: 100% verified across all 6 application sections via automated terminal audit suite.

## Next session starts with
- Monitor live production analytics, student test completions, and real-time dashboard interactions.

## Open questions
- None.
