# Memory — Odisha Leaderboard & PrepRank System (v2.8.0 - v3.3.0)

Last updated: 2026-08-08T06:41:30+05:30

## What was built

### 1. Master Dynamic Odisha Leaderboard & PrepRank System (v2.8.0 - v3.0.0)
- **Quality XP Engine & Dynamic State Rank ([src/lib/xpManager.ts](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/lib/xpManager.ts))**: Multi-factor quality XP formula scaling XP by `(Accuracy % / 100)^2` + question volume (+2 XP/q) + streak bonus (+20 XP/day). Eliminates rank inflation for low-scoring accounts.
- **3-Tab Reset System**: Date-seeded 365-day rotation for **Daily Rank** (resets midnight), **Weekly Rank** (resets Monday), and **All-Time** master legends.
- **Persistent Real Student Registry**: Persistent storage (`oep_real_user_leaderboard_registry`) linking real student test results so friends and peers compete on shared leaderboard ladders.

### 2. Tab-Specific Rank & High-Standard Difficulty Scaling (v3.0.3 - v3.1.0)
- **Tab-Specific Ranks**: Evaluates `todayXp` for Daily Rank (#5,840 out of 18,500 daily candidates), `weeklyXp` for Weekly Rank (#9,250), and lifetime XP for All-Time Rank (#12,840).
- **High-Standard Competitive XP Benchmarks**: Elevated Daily Toppers scale (6,850–14,500 XP), Weekly Toppers scale (24,500–58,000 XP), and All-Time scale (48,500–125,000 XP), making top ranks hard-earned and prestigious.

### 3. Student District Profile & 30-District Selection System (v3.2.0)
- **Student Profile Manager ([src/lib/profileManager.ts](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/lib/profileManager.ts))**: Manages persistent user district (`oep_user_district`) covering all 30 districts of Odisha.
- **Interactive District Selector Modal**: Clicking the district badge (`📍 Khordha (Bhubaneswar)`) on the Hero Banner opens a search modal where students can set their exact Odisha district anytime.

### 4. Mobile-First Responsive Leaderboard Optimization (v3.3.0)
- **Mobile Responsive Card ([src/components/OdishaLeaderboardCard.tsx](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/OdishaLeaderboardCard.tsx))**:
  - Restructured header bar inline (`flex flex-row justify-between gap-2`).
  - Compacted dark hero banner into a 2-row layout with dynamic min-width yellow rank box (`min-w-[3.5rem] sm:min-w-[4rem]`).
  - Integrated time reset tabs and state badge into a single inline flex toolbar.
  - Tuned Top 3 Podium step cards with responsive padding (`p-2.5 sm:p-5`), compact font scaling, and shortened district labels.

## Decisions made
- **Accuracy-Weighted Quality XP**: XP scales non-linearly with accuracy so poor scores (e.g. 20% accuracy) earn minimal XP (~15 XP) and cannot falsely reach #1.
- **30 Odisha Districts Support**: Full support for all 30 Odisha districts with interactive 1-tap district selection.
- **Mobile-First Responsive Layout**: Standardized UI across mobile and desktop displays without text clipping.

## Problems solved
- **Daily vs Weekly Identical Rank Mismatch**: Resolved by dynamically calculating separate candidate pool percentiles for Daily, Weekly, and All-Time views.
- **Yellow Rank Badge Text Overflow**: Replaced static width `w-14` (56px) with dynamic min-width `min-w-[3.5rem] sm:min-w-[4rem]` and font scaling.
- **Mobile UI Clutter**: Solved stretched badge pills and squished podium cards on small mobile screens (<640px).

## Current state
- TypeScript typecheck: **0 errors** (`npx tsc --noEmit`).
- Build log updated to **v3.3.0** in `progress-tracker.md`.
- Imprinted entry added to `ui-registry.md`.

## Next session starts with
- Verify live student engagement with PrepRank leaderboards and review any further feature requests.

## Open questions
- None.
