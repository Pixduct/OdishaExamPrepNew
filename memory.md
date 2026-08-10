# Memory — Multi-Exam Context Switching, Auth Privacy Guard & Glassmorphic Modal Architecture

Last updated: 2026-08-10T17:13:00+05:30

## What was built

### 1. Admin Sign-In & Supabase Credential Fix
- **`src/lib/supabase.ts`**: Restored exact literal `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY` syntax. Fixed runtime `Failed to fetch` error on `/admin-login` by enabling Vite bundler AST variable transformation.

### 2. Scoped AI Study Plan & Recommendation Engines
- **`src/lib/studyPlannerEngine.ts` & `src/lib/recommendationEngine.ts`**: Scoped weak topic analysis and fallback syllabus subjects strictly to `targetExam.examId`. Switching active target exams instantly refreshes daily study tasks to match the selected syllabus (e.g., CGL vs. Nursing).

### 3. Database-Driven Exam Context Selector
- **`src/lib/activeExamStore.ts`**: Removed all hardcoded mock exam arrays. Built `buildCategorizedExamsFromDb(dbExams)` to fetch and group live published database exams dynamically into clean categories (*Nursing & Healthcare*, *SSC & OSSC Exams*, *Civil Services*, *Police & Defence*, *Teaching & Education*).

### 4. Professional Empty State Handling
- **`src/components/AIStudyPlanCard.tsx`**: Added `hasContent` detection in `studyPlannerEngine.ts`. When a target exam has 0 published tests, displays a clean empty state card ("Content Coming Soon for `<Exam Name>`") with an interactive `[ Switch Target Exam ]` CTA button.

### 5. Glassmorphic Modal & React Document Portal Architecture
- **`src/components/ExamContextSelectorModal.tsx`**:
  - Upgraded overlay with ambient backdrop blur (`backdrop-blur-md bg-slate-950/80`) and locked background body scrolling (`document.body.style.overflow = 'hidden'`).
  - Fixed sticky top header (Title, Subtitle, Close Icon, Search Input) and fixed sticky bottom footer status bar.
  - Middle scrollable body uses thin `premium-scrollbar` with `overscroll-contain`.
  - Mounted modal directly to `document.body` via `createPortal(..., document.body)` with `z-[99999]`, eliminating top header bar and bottom mobile tab bar z-index clipping.

### 6. User Privacy & Authentication Guard
- **`src/App.tsx` & `src/StudyPlanView.tsx`**:
  - Protected all personal user data cards (`ExamReadinessCard`, `AIStudyPlanCard`, `SmartRecommendationCard`, `StreakWidgetCard`, `OdishaLeaderboardCard`, `TopicConfidenceMatrix`, `PersonalBestCard`) behind an authentication check (`user`).
  - Unauthenticated visitors (`!user`) see a clean guest sign-in banner ("Sign In to Access Your Personal AI Study Plan & Score Tracker") with an event-driven sign-in CTA button (`setShowAuthModal(true)` / `oep-open-auth-modal`).
  - Wrapped top header flame streak buttons (`🔥 X Days` / `🔥 Xd`) in `{user && ( ... )}` on desktop and mobile headers, hiding dummy streak metrics when signed out.

### 7. UI Registry Imprinting
- **`context/ui-registry.md`**: Recorded entries #35 (`ExamContextSelectorModal`) and #36 (`GuestSignInCalloutBanner`).

## Decisions made
- **Vite Env Variable Transpilation Rules**: Always use exact string literals `import.meta.env.VITE_*` to allow Vite's AST replacer to substitute environment variables.
- **Modal Portaling**: Mount all global modals via `createPortal(..., document.body)` with `z-[99999]` to avoid CSS stacking context entrapment inside layout components.
- **Strict User Privacy**: Private student metrics, study plan tasks, weak topic matrices, and streak counters are strictly guarded behind `user` authentication.

## Problems solved
- **Admin Login `Failed to fetch`**: Resolved by restoring exact literal `import.meta.env.VITE_*` syntax in `supabase.ts`.
- **AI Tasks Not Refreshing on Exam Switch**: Fixed by scoping weak topic recommendation engines to active `examId`.
- **Dummy Mock Exams & Fallback Tasks**: Replaced hardcoded arrays with dynamic DB exam builder and clean empty states.
- **Modal Header & Footer Clipping**: Resolved via React Portal and sticky fixed container locks.
- **Personal Data Exposure to Unauthenticated Guests**: Protected all personal cards and header streak pills behind `user` auth checks.

## Current state
- TypeScript build: **0 compilation errors** (`npx tsc --noEmit` passes cleanly).
- Git repository: 10 clean commits committed locally on `main` branch.

## Next session starts with
- Execute `git push origin main` when instructed by user to publish local commits to remote repository.
- Monitor student dashboard logins, exam switching interactions, and practice session completions.

## Open questions
- None.
