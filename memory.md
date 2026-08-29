# Memory — 🎯 Exam In-Progress Session Isolation, 0-Question Mock Test Defense & Global Error Filter Fix

Last updated: August 29, 2026, 07:21 IST

## What was built

### 1. In-Progress Session & Exam Isolation (`src/App.tsx`)
- **Strict Exam-Scoped Incomplete Matching**:
  - Removed title-based cross-exam matching in `GuidedRecommendationHero` in `src/App.tsx`.
  - Incomplete activity lookup now strictly requires matching `selectedExam` (via `metadata.examId`, unique `bankId`, or unique `testId` belonging exclusively to `selectedExam`).
  - Cross-exam leakage where a test from another exam (e.g. *Nursing Officer*) rendered on *OPSC AFO* is completely eliminated.
- **Reload Recovery Effect Isolation**:
  - Updated the session recovery hook in `src/App.tsx` to verify `test.examId` against `selectedExam`.
  - Stale or mismatched active test sessions in `sessionStorage` are automatically purged upon loading a different exam page, preventing unexpected test runner popups on page reload.
- **Saved Session State Integrity (`src/MockTestSystem.tsx`)**:
  - `MockTestSystem` now explicitly saves `examId: test.examId` in `oep_activeTestState`.

### 2. 0-Question Mock Test Defensive Handling (`src/App.tsx`)
- **Safe Empty Test Interception in `handleStartTest`**:
  - When launching a database-backed Mock Test (`!id.startsWith('practice-')`), if the database returns 0 questions, the runner halts cleanly with a user-friendly alert (*"No questions have been configured for this mock test yet..."*).
  - Automatically purges any phantom incomplete activity from `activityTracker` and never falls back to foreign question banks or compiles unrelated drills.

### 3. State-Relevant Question Fallback Engine (`src/lib/instantQuestionCompiler.ts`)
- **Odisha State Competitive Exam Datasets**:
  - Added pre-compiled question banks for **General Studies & Odisha GK**, **Quantitative Aptitude**, and **Reasoning & Mental Ability**.
  - Replaced the hardcoded medical nursing fallback with General Studies & Odisha GK for non-medical topics.

### 4. Database-First Question Bank Loading (`src/App.tsx`)
- **Direct Practice DB Querying**:
  - `handleStartDirectPractice` now checks Supabase DB questions (`examService.getQuestionsForQuestionBank`) for the specific exam before compiling instant drills.
  - Removed legacy hardcoded `'osssc-nursing-2026'` fallback strings across `handleStartDirectPractice` and event listeners.

### 5. Fatal Error Overlay Filter (`index.html`)
- **Dev Server & Non-Fatal Error Filtering**:
  - Added `isIgnorableError` helper to `window.addEventListener('error')` and `unhandledrejection` in `index.html`.
  - Ignored benign Vite HMR WebSocket reconnect notices (`WebSocket closed without opened`, `@vite/client`), browser extension exceptions, and `ResizeObserver` loops so temporary HMR socket disconnects or page reloads never trigger the full-page blue `Application Error` overlay.

### 6. Mock Test Creation Schema Sanitization (`src/AdminPanel.tsx`, `src/lib/examService.ts`, `server.ts`)
- Removed `examId` and `questionIds` from mock test payloads in `handleBulkImport` and `handleAdd`.
- Sanitized client-side virtual fields (`examId`, `questions`, `questionIds`, `isPremium`, `category`, `_questionCount`) in `examService.ts` and `/api/admin/db/:table` proxy in `server.ts` before writing to Supabase PostgREST.

---

## Decisions made
- **Zero Title-Based Activity Matching Across Exams**: Test titles like "Full-Length Mock Test 01" or "Sectional Test 01" are generic and shared across exams; activities must strictly match by explicit `examId`, unique `bankId`, or unique `testId`.
- **0-Question Mock Test Rule**: A mock test without questions in the database must never borrow questions from unrelated question banks; it must display an informative notice and halt.
- **Benign WebSocket Error Filtering**: Vite dev server HMR socket disconnects are normal during development and reloads and must never block the user interface with fatal error overlays.

---

## Problems solved
- **Solved Cross-Exam In-Progress Test Banner Leakage**: Fixed bug where an in-progress session from Nursing Officer rendered on OPSC AFO and resumed Nursing questions.
- **Solved Page Reload Flashing into Test Runner**: Fixed bug where `Recovery Effect` restored a stale cross-exam `sessionStorage` session on page reload.
- **Solved Blue Screen "WebSocket closed without opened" Overlay**: Added filter in `index.html` to prevent dev HMR socket notices from triggering fatal error overlays.
- **Solved Mock Test Schema Cache Error**: Stripped virtual non-column fields from `mockTests` insert payloads.

---

## Current state
- Fully implemented, tested, and passing production build (`npm run build` exit code: 0).
- All context files (`progress-tracker.md`, `ui-registry.md`) updated and in sync.

---

## Next session starts with
- Ready for production usage or further feature additions.

---

## Open questions
- None. All issues resolved and verified.
