# Memory — Notification Center Overhaul, Blur Bug Fix & Scheduled Live Alerts (v1.6.6)

Last updated: 2026-07-25T18:19:00+05:30

## What was built

### 1. Notification Center Blur Strength Increase — `src/components/NotificationCenter.tsx`
- Increased backdrop blur on the notification dropdown from `backdrop-blur-xl` to `backdrop-blur-3xl`.
- Raised background opacity of the popover panel to `bg-white/95` to ensure notifications are legible over any background.

### 2. Notification Center Redesign — `src/components/NotificationCenter.tsx`
- Removed the "Scheduled Live" filter tab bar entirely (was previously filtering by type).
- Added a persistent **"Clear"** button in the header that stores cleared notification IDs in `localStorage` under `oep_cleared_notifications`.
- Added **"Mark read"** button that stores read IDs in `localStorage` under `oep_read_notifications`.
- Replaced static/hardcoded notification entries with a fully **dynamic `useMemo` builder** that auto-generates notifications from live `exams`, `mockTests`, and `dynamicQuestionBanks` props.
- Each notification type gets its own gradient icon: exams = `indigo→purple`, tests = `blue→cyan`, banks = `emerald→teal`.

### 3. Persistent Page Blur Bug — Root Cause Fix — `src/App.tsx`
- **Root cause identified:** `selectedBankItem` state was lazily initialised by reading `oep_selectedBankItem` from `sessionStorage`. This made it non-null immediately on mount, firing the body-blur `useEffect` before `renderCommonModals()` had mounted (auth still loading). Result: blur ON, modal OFF, no close button.
- **Fix Part 1 (line ~4066):** `selectedBankItem` now always initialises as `null` — **never restores from sessionStorage on mount**.
- **Fix Part 2 (line ~9432):** Added a startup `useEffect` in `AppContent` that calls `sessionStorage.removeItem('oep_selectedBankItem')` on every page load to wipe any stale key from before this fix.
- The `sessionStorage.setItem` write (for mid-session navigation) was preserved but the restore was removed.

### 4. Empty Banks Filtered from Notifications — `src/components/NotificationCenter.tsx`
- Banks with 0 questions AND 0 PDF links are now excluded from the notification list before being added.
- Filter: `(questionCount || questions || practiceQuestionCount || 0) > 0 || pdfLinks.length > 0`.
- Added a **click-time safety guard** in `handleNotificationClick`: if a bank somehow slips through and has no content, the click silently returns without calling `onLaunchBank` (prevents blur lock with no modal).
- This fixed "High-Yield Pharmacology Drills 2" incorrectly appearing in notifications.

### 5. Scheduled Test Live / Upcoming Notifications — `src/components/NotificationCenter.tsx`
- Extended the notification builder `useMemo` to classify tests with `scheduled_at`:
  - **`scheduled_at <= now`** → type `'scheduled_live'`: amber gradient pulsing icon, red **"LIVE"** pill badge, message "Your scheduled test is now LIVE — start it before time runs out!", `actionType: 'test'` (clickable, launches test directly).
  - **`scheduled_at > now`** → type `'scheduled_upcoming'`: grey icon, **"SOON"** pill badge, countdown message like "goes live in 2h 30m. Be ready!", `actionType: 'none'` (non-clickable, no chevron rendered).
  - **No `scheduled_at`** → regular `'new_test'` entry as before.
- LIVE items are **always sorted to the top** of the notification list, pinned above all others regardless of timestamp (implemented by splitting `liveItems` + `otherItems` in the `useMemo` return).

### 6. Imprinting — `context/ui-registry.md`
- Imprinted **`NotificationCenter`** (entry 18): all row states, icon gradients, badge classes, popover shape (`rounded-3xl`), and 7 pattern notes.
- Imprinted **`GlobalSearchModal`** (entry 19): backdrop, window shape (`rounded-[2rem]`), per-section accent color system (exams=brand, tests=indigo, banks=emerald), portal pattern, animation direction.

---

## Decisions made

- **`selectedBankItem` must NEVER be restored from sessionStorage on mount.** The blur/lock effect fires synchronously during mount. If the modal isn't rendered yet, there is no way to close it. The sessionStorage write (for mid-session navigation) is kept, but the restore is permanently removed.
- **Startup cleanup in `AppContent`:** A `useEffect(() => { sessionStorage.removeItem('oep_selectedBankItem'); }, [])` in `AppContent` wipes any stale key that predates this fix, ensuring clean state on every page load.
- **Empty banks must be filtered at the source** (in the notification builder `useMemo`), not at click time. Click-time guard is a secondary safety net only.
- **LIVE scheduled tests are pinned first** by list-splitting, not by timestamp sorting. Sorting alone doesn't guarantee top position when live tests have older timestamps.
- **UPCOMING notifications are strictly non-actionable** (`actionType: 'none'`). The `handleNotificationClick` guard returns early before marking as read or calling any handler. No chevron is rendered.
- **`GlobalSearchModal` uses `rounded-[2rem]`** (same as card modals), not `rounded-3xl` like `NotificationCenter`. This distinction is intentional and documented in the registry.
- **Each search section uses its own accent color** (brand/indigo/emerald). Do not mix accent colors across sections in `GlobalSearchModal`.

---

## Problems solved

- **Persistent page blur after hard refresh:** `selectedBankItem` was restored from sessionStorage on mount, triggering blur before the modal could render. Fixed by removing the lazy initialiser restore and adding a startup cleanup in `AppContent`.
- **Blur when clicking empty bank notification ("High-Yield Pharmacology Drills 2"):** Empty banks had no content, so the modal crashed/couldn't render, trapping the blur. Fixed by filtering empty banks from the notification list and adding a click-time guard.
- **Scheduled tests not appearing in notifications:** The notification builder treated ALL tests as regular new_test entries. Fixed by checking `scheduled_at` and classifying into `scheduled_live` / `scheduled_upcoming` / `new_test`.
- **Notifications showing un-published/empty content:** The `flatBanks.forEach` added every bank unconditionally. Fixed with the `hasQuestions || hasPdfs` filter.

---

## Current state

- Notification Center: ✅ Fully dynamic, live/upcoming scheduled alerts, empty bank filter, clear/mark-read with localStorage persistence
- Persistent blur bug: ✅ Root cause fixed — hard refresh always clears blur
- Scheduled test notifications: ✅ LIVE pinned at top (amber/pulsing), SOON shown with countdown (grey/non-clickable)
- TypeScript compilation: ✅ 0 errors (verified with `npx tsc --noEmit` after each change)
- UI Registry: ✅ `NotificationCenter` (entry 18) and `GlobalSearchModal` (entry 19) imprinted
- Progress tracker: ✅ Updated to `v1.6.6`
- Dev server: ✅ Operational at `http://localhost:3000`

---

## Next session starts with

- Verify scheduled test LIVE notification appears correctly in the browser when a test's `scheduled_at` passes.
- Check that the notification count badge on the bell updates immediately when a scheduled test goes live (client-side re-evaluation on open).
- Proceed to next user-requested feature or bug.

---

## Open questions

- The notification `useMemo` recomputes only when `mockTests` prop changes — not on a live timer. If a test goes live while the notification panel is closed, the LIVE badge only appears after the panel is next opened (data re-fetches, or on next `mockTests` prop update). This may need a time-based re-evaluation if real-time accuracy is required.
- Consider whether the `oep_selectedBankItem` sessionStorage key should be fully deprecated (the write in the `useEffect` is now dead code since nothing reads it on mount).
