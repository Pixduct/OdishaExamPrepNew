# Memory — Auto-Interval Rolling Unlock Scheduler & Subject Hierarchy Engine

Last updated: August 24, 2026, 21:10 IST

## What was built

### 1. Auto-Interval Rolling Unlock Scheduler for Bulk Importer (`src/AdminPanel.tsx`)
- **Staggered Per-Item Unlock Engine**: Added `bulkAutoScheduleEnabled`, `bulkAutoScheduleIntervalDays` (number >= 0), and `bulkAutoScheduleIntervalHours` (number 0-23) states supporting rolling scheduled unlocking across `banks`, `practice`, and `tests` tabs.
- **Dedicated Schedule Settings Card UI**: Added a distinct `🗓️ Schedule Settings` card with `bg-slate-50/60`, `border border-slate-200/80`, dynamic `⚡ Auto-Interval ON` emerald badge, custom toggle switch, dynamic `Start At:` datetime-local input, and separate `[Days] + [Hours]` interval inputs.
- **Live Unlock Schedule Preview**: Built real-time preview showing exact date & time (`en-IN` format) for up to 10 items, total item count indicator, and an amber alert panel when interval is 0.
- **Single-Pass JSON & Hoisted Pure Computation**: Single `JSON.parse` execution per render; `computeScheduleForItem(item, index)` hoisted above the batch loop with pre-computed `totalIntervalMs`.
- **Session Persistence**: Sticky state saved and restored automatically via `sessionStorage` (`oep_sticky_bulk_`).

### 2. Subject Hierarchy & Table Grouping Engine (`src/AdminPanel.tsx`)
- **Per-Subject Sequential Ordering**: Enhanced `getNextAvailableOrder` to compute available sort orders on a per-subject basis, ensuring items in each subject folder count sequentially without colliding.
- **Subject Filter Pills & Banners**: Added interactive subject filter pill bar with auto-tab switching and structured table headers.

### 3. Registry & Tracker Documentation (`context/ui-registry.md`, `context/progress-tracker.md`)
- Registered `101a. AdminAutoIntervalScheduler` component pattern with exact token mapping, color discipline (`emerald-*` for auto-schedule, `amber-*` for caution), and usage rules.
- Updated completed tasks ledger in `progress-tracker.md`.

---

## Decisions made

- **Separate Day & Hour Inputs**: User decision — separate dedicated number inputs for Days and Hours rather than a single combined dropdown/unit selector.
- **Index 0 Exact Start Date**: Item #1 unlocks at the exact `Start At` datetime with 0 ms offset (`itemIndex * totalIntervalMs`).
- **All Tabs Universality**: The auto-interval engine is universally available across all bulk import entity types (`banks`, `practice`, `tests`).
- **Per-Item Override Precedence**: If an individual item in the uploaded JSON specifies its own `scheduled_at` timestamp, it takes strict precedence over the auto-calculated interval timestamp.
- **Color Token Separation**: `emerald-*` is used strictly for Auto-Interval active states to prevent visual collision with `brand-600` (premium/locked) and `rose-600` (destructive) controls.

---

## Problems solved

- **Loop Function Redeclaration**: Hoisted `computeScheduleForItem` out of the `handleBulkImport` iteration loop to avoid function redeclaration overhead.
- **Zero-Interval Silent Collision**: Added an amber warning card in the preview and an active logic guard (`&& totalIntervalMs > 0`) so 0 Days + 0 Hours does not silently assign identical timestamps without user notification.
- **Multiple JSON Parse Calls**: Consolidated multiple `JSON.parse` operations in the preview renderer into a single parse step with derived slice and length.

---

## Current state

- All code written, tested, built cleanly (`npm run build` exits 0), and pushed to GitHub `main` (`origin/main`).
- Auto-Interval bulk scheduling is live in Admin Panel.
- `ui-registry.md` and `progress-tracker.md` fully up-to-date.

---

## Next session starts with

- Ready for next feature development, UI enhancement, or test series workflow improvements.

---

## Open questions

- None.



