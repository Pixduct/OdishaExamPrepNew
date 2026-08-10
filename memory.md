# Memory — Mobile UI Refinement, Real Login Profile Sync & Real-Time Daily Leaderboard Engine

Last updated: 2026-08-10T20:05:30+05:30

## What was built

### 1. Mobile-Optimized "Today's AI Study Plan" Component (v3.7.1)
- **`src/components/AIStudyPlanCard.tsx`**: Fixed task title clipping on mobile viewports (`<640px`) so long task titles wrap naturally, made header category pills horizontally scrollable with compact padding, simplified mobile progress bar text (`50% (2/4 Done)`), and added a sleek mobile task card footer row (`💡 Rationale` + compact `[ Start → ]` button) while leaving desktop/laptop view 100% untouched.

### 2. Mobile-Optimized "Odisha Rank & Student Leagues" Component (v3.7.2)
- **`src/components/OdishaLeaderboardCard.tsx`**: Fixed header title truncation on mobile (`"Odisha Rank & Leagues"`), added smart mobile name formatting on 3-tile podium cards (`"Jagannath S."`, `"Anwesha M."`, `"Amresh S."`) to eliminate ellipsis truncation, and simplified subtext & district badges on mobile list items (`"Khordha • Diamond"`).

### 3. Leaderboard Rank Container Spacing & Real User Profile Matching (v3.7.3)
- **`src/components/OdishaLeaderboardCard.tsx` & `src/lib/profileManager.ts` & `src/lib/xpManager.ts`**:
  - Expanded rank number container (`w-14 sm:w-16`, 56px–64px) and column gap (`gap-3.5`) to eliminate rank number collisions with student avatar circles (`#13,017` vs avatar circle).
  - Connected `useAuth()` metadata (`avatar_url`, `full_name`, `name`) to display the student's real profile photo or actual name initial (`N` for Naresh) across the hero banner, podium cards, master list, and nearby rivals bracket instead of fallback generic strings (`👉 YOU (Aspirant)` / `Y`).

### 4. Deterministic Real-Time Dynamic Daily Leaderboard Progression Engine (v3.8.0)
- **`src/lib/xpManager.ts`**:
  - Built 15-minute time-seeded progression engine for `getDailyLeaderboardSeed()`.
  - Peer scores dynamically accumulate along an organic daily study curve (peak study hours 06:00–11:00 & 16:00–22:00 IST).
  - Bounded micro-fluctuations ($\pm 15$ XP per 15-min slot) trigger natural rank swaps between close competitors while keeping page refreshes within the same window 100% stable.
  - Automatically recalculates the logged-in student's live rank position instantly upon completing practice drills or tests.

### 5. UI Registry & Progress Tracker Updates
- **`context/progress-tracker.md`**: Updated to v3.8.0.
- **`context/ui-registry.md`**: Imprinted entry #37 (`OdishaLeaderboardCard`).

## Decisions made
- **Deterministic Time-Windowing**: Anchored daily leaderboard updates to date + 15-minute interval slots (`slotIndex = hour * 4 + Math.floor(minute / 15)`). Page refreshes within the same 15-minute window display 100% identical, reliable scores without random jitter.
- **Organic Odisha Study Curve**: Modeled daily peer XP growth using weighted time-of-day slots reflecting real aspirant prep schedules (morning & evening study surges).
- **Strict User Profile Resolution**: Dynamically extract real user name and Google OAuth avatar photo from `useAuth()` metadata to ensure true personalization across gamification cards.

## Problems solved
- **Mobile AI Task Title Clipping**: Fixed truncation by eliminating static height constraints and allowing title text wrapping on mobile.
- **Podium Ellipsis Truncation**: Solved via `getMobileDisplayName` smart initial formatting (`"Jagannath S."`).
- **Rank Number Overlapping Avatar Circles**: Resolved by widening rank container to `w-14 sm:w-16` with `gap-3.5`.
- **Generic "YOU (Aspirant)" Avatar Fallback**: Replaced with live Supabase Auth / Google profile name and photo.
- **Static Daily Leaderboard**: Upgraded from once-a-day static scores to a live, dynamic progression engine.

## Current state
- TypeScript check: **0 compilation errors** (`npx tsc --noEmit` passes cleanly).
- Git repository: All commits pushed to `origin/main` (latest commit `08f5d83`).

## Next session starts with
- Continue monitoring user engagement on the live daily leaderboard and mobile study plan view.
- Perform any additional UI enhancements or backend feature expansions requested by the user.

## Open questions
- None.
