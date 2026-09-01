# Memory — 3-Tier SaaS Pricing Architecture, Mobile SaaS Redesign & Granular Starter Controls

Last updated: September 1, 2026, 20:40 IST

---

## What was built

### 1. Minimalist 3-Tier SaaS Pricing & Mobile Redesign (`src/App.tsx`)
- **Desktop/Laptop View**: Clean 3-column minimalist SaaS grid (`TieredPricingSaaSFallbackModal`) with elevated center card, live Truth Engine database metrics, and 1-click Razorpay checkout.
- **Mobile SaaS Redesign (ChatGPT & Claude Standard)**:
  - **Segmented Plan Switcher**: 3 interactive pill tabs (`[ ⚡ Starter (₹29) ]`, `[ 🔥 Pass (₹149) ]`, `[ 👑 Super (₹199) ]`) with active highlight and fluid micro-transitions.
  - **Single Focused Hero Plan Card**: Large bold in-card price (`₹149`), strike-through MRP (`₹999`), savings pill (`85% SAVED`), and 4–5 spacious checkmarks with soft emerald icons.
  - **Direct In-Card CTA**: Prominent gradient action button (`🚀 Unlock Full Pass (₹149) →`).
  - **Zero Double-Pricing**: Removed the redundant bottom price row that previously caused visual clutter on small viewports.

### 2. Modernized Batch Content Action Center (`src/AdminPanel.tsx`)
- **Legacy Pricing Clutter Removed**: Eliminated old `₹499`, `MRP: 999`, and `Keep Free: 2` inputs from the floating multi-select bar to prevent accidental overrides of centralized 3-Tier Exam pricing.
- **Sleek Administrative Actions**: When selecting multiple Question Banks, Practice Sets, or Mock Tests, the floating bar now provides:
  1. `🔒 Make Premium` — Protects selected items under the Exam's 3-Tier Paywall.
  2. `🔓 Make Free Demo` — Marks items as unconditionally free samples.
  3. `🗑️ Delete Selected` — Bulk deletes items with confirmation and cache invalidation.
  4. `✖ Deselect All` — Clears active checkbox selection.

### 3. 3-Pillar Granular Starter Booster Controls (`src/AdminPanel.tsx`)
- **Admin Control over Starter Inclusions**: Inside Admin Panel ➔ Exams ➔ Tier 1 Starter Booster, admins have independent granular controls:
  1. `Offer Price (₹)` (e.g. 29) & `MRP (₹)` (e.g. 99)
  2. `Full Mocks Included` (`starterMockCount`, default: 5)
  3. `Sectional Tests / Subject` (`starterSectionalCount`, default: 2)
  4. `Question Banks / Subject` (`starterBankCount`, default: 2)
- **Global Super Pass Info Card**: Streamlined Tier 3 inside exam modals into an informational card explaining that this exam is automatically included for all 1-Year Super Pass students platform-wide (managed globally).
- **Default Toggle State**: Creating a new exam defaults `isPremium: true` (ON) with standard presets; editing an existing exam strictly reflects its real database state.

### 4. Balanced Subject Taster Entitlement Engine (`src/lib/entitlementEngine.ts`, `src/App.tsx`)
- **Multi-Subject Sectional Unlocking**: Evaluates relative subject rank (`subjectRank <= starterSectionalCount`). Starter Booster holders get tests #1 and #2 unlocked across **every subject** (Anatomy, Pharmacology, Community Health, etc.) rather than exhausting all 5 slots on Subject #1.
- **Subject-Wise Question Bank Unlocking**: Evaluates relative rank within each subject category (`bankSubjectRank <= starterBankCount`). Starter Booster holders get the first 2 Question Banks / Practice Sets unlocked in every subject.
- **Full Exam Pass (₹149)**: Unlocks 100% of all tests, banks, PDF solution vaults, and AI Mentor.

### 5. End-to-End Price Parity & Automated Expiration (`server.ts`, `src/lib/examService.ts`)
- **Fixed ₹99 vs ₹149 Pricing Parity**: Corrected frontend metadata extraction so real active exam prices (e.g. ₹149) render immediately on cards and match backend Razorpay order creation with 0 discrepancy.
- **Automated Expiration Tracking**: `server.ts` calculates tier-specific durations upon payment verification:
  - Starter Booster: 90 Days (`3 Months`)
  - Complete Exam Pass: 180 Days (`6 Months`)
  - Super Pass: 365 Days (`1 Year VIP`)
  - Records `expires_at` in the `user_purchases` ledger and synchronizes user metadata in Supabase Auth.
- **Instant Live Update Broadcast**: Saving changes in `AdminPanel.tsx` clears `sessionStorage` and dispatches `oep_catalog_updated`, immediately re-rendering the frontend without manual refresh.

---

## Decisions made

1. **Mobile Segmented Switcher over Dense Vertical Stack**: A tabbed hero card provides maximum focus and readability on mobile viewports (360px–412px), matching modern industry leaders (ChatGPT Plus / Claude Pro).
2. **Centralized Exam-Level Pricing**: Bulk multi-select actions in the admin table only toggle content access status (`Premium` vs `Free Demo`) or perform batch deletion; pricing is governed strictly at the Exam policy level.
3. **Relative Subject Ranking**: Starter entitlement evaluates relative rank *within each academic subject*, ensuring students get balanced syllabus exposure.

---

## Problems solved

1. **Mobile Modal Clutter & Double Pricing**: Eliminated redundant bottom price block and 3 stacked radio rows on mobile by switching to a segmented tabbed hero card.
2. **Batch Pricing Conflict**: Removed legacy ₹499 individual price overrides from the floating table bar.
3. **Starter Pack Subject Exhaustion**: Resolved the issue where a 5-test limit unlocked only Subject #1, leaving all other subjects locked.

---

## Current state

- **Build Status**: `npm run build` passes with **0 errors (Exit code 0)**.
- **Git Repository**: All changes pushed to `origin/main` (latest commit `365d5af`).
- **Functionality**: 3-tier dynamic pricing, mobile SaaS modal redesign, modernized bulk admin actions, granular starter controls, and automated expiration tracking are active and verified.

---

## Next session starts with

1. **Strategy 5 (Post-Exam "Download Test PDF with Solutions")**: Build candidate PDF export feature allowing students to download fully formatted test papers with complete step-by-step solutions after completing a mock test.
2. **Mobile Layout Deep Pass**: Further fine-tune touch targets and responsive layouts across secondary pages.

---

## Open questions

- None currently pending.
