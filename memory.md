# Memory — Mobile View UX Refinement & Authenticated-Only Onboarding & Notification Guards

Last updated: 2026-08-10T20:19:35+05:30

## What was built

### 1. Mobile-Refined Layout for "Your Weak Topics & Practice Plan" (v3.8.1)
- **`src/components/TopicConfidenceMatrix.tsx`**: Fixed topic title squishing and truncation on mobile (`<640px`) by building a dedicated 2-line header layout for topic title and status badge (`Needs Practice` / `Strong Area`), separated accuracy metadata sub-rows, and added full-width touch-friendly CTA buttons (`Resume Practice (Q16/100)` / `Start Practice Drill →`).
- **`src/components/SmartRecommendationCard.tsx`**: Formatted mobile weak area recommendation banner into a clean 2-row layout (`⚡ Weak Area` tag on top, full topic title e.g. `Medical-Surgical Nursing` and accuracy badge below), preventing clipped title text with an ellipsis (`Medical-Sur...`).

### 2. Mobile-Refined Layout for "Your Personal Records & Milestones" (v3.8.2)
- **`src/components/PersonalBestCard.tsx`**: Fixed tag pill collisions on mobile tiles by hiding redundant category pills (`Score`, `Accuracy`, `Speed`, `Streak`) on mobile screens (`sm:hidden`), formatted empty states into clean 1-line labels (`No Record Yet` in `text-xs font-bold text-slate-400 font-sans`), formatted streak values (`1 Day Streak`), and eliminated redundant stacked subtext lines, while leaving desktop/laptop layout 100% untouched.

### 3. Mobile-Refined Layout for Target Exam Context Bar & Switch Target Modal (v3.8.3)
- **`src/components/ActiveExamContextBar.tsx`**: Replaced harsh solid black button on mobile target bar with a sleek brand glassmorphic pill button (`[ Switch ⌄ ]` in `bg-brand-50 text-brand-700 border border-brand-200/80`), formatted container into a subtle gradient card (`bg-gradient-to-r from-slate-50/90 via-white to-brand-50/30`).
- **`src/components/ExamContextSelectorModal.tsx`**: Formatted modal subtitle/search placeholder concise text, fixed badge collision on the "All Exams Combined" card by placing the `AGGREGATED VIEW` badge on a new line on mobile (`flex flex-col sm:flex-row`), and simplified the `Active Target` checkmark indicator in list items to prevent title truncation on mobile.

### 4. Authenticated-Only Onboarding Modals & Notification Permission Guard Engine (v3.8.4)
- **`src/App.tsx`**, **`src/components/WelcomeVideoModal.tsx`**, **`src/components/OnboardingTour.tsx`**, **`src/components/PushPermissionPrompt.tsx`**:
  - Enforced strict authentication and per-account completion guards.
  - Fixed issue where onboarding video guide modals, guided tour overlays, and push notification permission popups were showing to unauthenticated/logged-out visitors browsing the site or in incognito mode.
  - Guest/incognito visitors browsing the site will **never** see onboarding modals or push prompts.
  - `WelcomeVideoModal` & `OnboardingTour` trigger **only** for newly registered users upon their first login and permanently persist completion state per account ID (`oep_welcome_video_seen_${userId}` and `oep_tour_completed_${userId}`).
  - `PushPermissionPrompt` strictly checks user authentication, browser blocked/granted state (`permissionState === 'default'`), and dismissal flags (`oep_push_prompt_dismissed_${userId}`).

### 5. UI Registry Imprinting & GitHub Sync
- **`context/ui-registry.md`**: Imprinted Section 38 (`TopicConfidenceMatrix`), Section 39 (`PersonalBestCard`), Section 40 (`ActiveExamContextBar` & `ExamContextSelectorModal`), and Section 41 (`WelcomeVideoModal`, `OnboardingTour` & `PushPermissionPrompt`).
- **`context/progress-tracker.md`**: Updated release log to version `3.8.4`.
- **GitHub Sync**: All commits up to `a07e9bb` pushed to `origin/main`.

## Decisions made
- **Mobile-First Layout Branching**: Used dedicated mobile block structures (`sm:hidden` vs `hidden sm:flex`) so mobile cards have 100% breathing room without altering desktop/laptop aesthetics.
- **Strict Visitor Privacy & Auth Guarding**: Onboarding popups and notification permission prompts must never disrupt unauthenticated/logged-out guests. Auth state checks (`user && !loading`) and per-user account keys (`${key}_${userId}`) enforce zero popup noise.
- **Permanent Dismissal Persistence**: Dismissing or completing an onboarding video or notification prompt permanently writes to `localStorage` per user account ID so popups never recur unexpectedly.

## Problems solved
- **Mobile Topic Title Squishing**: Resolved by building a 2-line header layout in `TopicConfidenceMatrix.tsx`.
- **Personal Best Tile Badge Collision**: Resolved by hiding category pills on mobile screens (`sm:hidden`) in `PersonalBestCard.tsx`.
- **Target Exam Bar Black Box Contrast**: Replaced with a sleek brand glassmorphic pill button (`[ Switch ⌄ ]`) in `ActiveExamContextBar.tsx`.
- **Logged-Out Popup Intrusion**: Fixed by wrapping `WelcomeVideoModal`, `OnboardingTour`, and `PushPermissionPrompt` in strict `userId` and `user` auth checks.

## Current state
- TypeScript check: **0 compilation errors** (`npx tsc --noEmit` passes cleanly).
- Git repository: All commits pushed to `origin/main` (latest commit `a07e9bb`).

## Next session starts with
- Continue monitoring user onboarding flow and mobile UX across all dashboard views.
- Implement any follow-up feature expansions or visual enhancements requested by the user.

## Open questions
- None.
