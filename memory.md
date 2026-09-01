# Memory — 3-Tier SaaS Pricing Architecture, 3-Pillar Granular Starter Controls & Balanced Multi-Subject Entitlement

Last updated: September 1, 2026, 19:55 IST

---

## What was built

### 1. Minimalist 3-Tier SaaS Pricing Grid (`src/App.tsx`)
- **ChatGPT & Claude Pro Design Standard**: Replaced cluttered text boxes with a clean, scannable 3-column pricing grid (`TieredPricingSaaSFallbackModal`) inside the unlock modal.
- **Smart Content Truth Engine**: Live dynamic calculation of real database metrics (`totalExamMocks`, `totalExamQuestions`, and global platform counts for Super Pass) replacing hardcoded numbers.
- **Direct 1-Click Razorpay Checkout**: Each card features a dedicated checkout launcher with dynamic payload resolution (`starter-booster_${examId}`, `exam-pass_${examId}`, `all-access`).

### 2. 3-Pillar Granular Starter Booster Controls (`src/AdminPanel.tsx`)
- **Admin Control over Starter Inclusions**: Inside Admin Panel ➔ Exams ➔ Tier 1 Starter Booster, admins have independent granular controls:
  1. `Offer Price (₹)` (e.g. 29) & `MRP (₹)` (e.g. 99)
  2. `Full Mocks Included` (`starterMockCount`, default: 5)
  3. `Sectional Tests / Subject` (`starterSectionalCount`, default: 2)
  4. `Question Banks / Subject` (`starterBankCount`, default: 2)
- **Global Super Pass Info Card**: Streamlined Tier 3 inside exam modals into an informational card explaining that this exam is automatically included for all 1-Year Super Pass students platform-wide (managed globally).
- **Default Toggle State**: Creating a new exam defaults `isPremium: true` (ON) with standard presets; editing an existing exam strictly reflects its real database state.

### 3. Balanced Subject Taster Entitlement Engine (`src/lib/entitlementEngine.ts`, `src/App.tsx`)
- **Multi-Subject Sectional Unlocking**: Evaluates relative subject rank (`subjectRank <= starterSectionalCount`). Starter Booster holders get tests #1 and #2 unlocked across **every subject** (Anatomy, Pharmacology, Community Health, etc.) rather than exhausting all 5 slots on Subject #1.
- **Subject-Wise Question Bank Unlocking**: Evaluates relative rank within each subject category (`bankSubjectRank <= starterBankCount`). Starter Booster holders get the first 2 Question Banks / Practice Sets unlocked in every subject.
- **Full Exam Pass (₹149)**: Unlocks 100% of all tests, banks, PDF solution vaults, and AI Mentor.

### 4. End-to-End Price Parity & Automated Expiration (`server.ts`, `src/lib/examService.ts`)
- **Fixed ₹99 vs ₹149 Pricing Parity**: Corrected frontend metadata extraction so real active exam prices (e.g. ₹149) render immediately on cards and match backend Razorpay order creation with 0 discrepancy.
- **Automated Expiration Tracking**: `server.ts` calculates tier-specific durations upon payment verification:
  - Starter Booster: 90 Days (`3 Months`)
  - Complete Exam Pass: 180 Days (`6 Months`)
  - Super Pass: 365 Days (`1 Year VIP`)
  - Records `expires_at` in the `user_purchases` ledger and synchronizes user metadata in Supabase Auth.
- **Instant Live Update Broadcast**: Saving changes in `AdminPanel.tsx` clears `sessionStorage` and dispatches `oep_catalog_updated`, immediately re-rendering the frontend without manual refresh.

---

## Decisions made

1. **Relative Subject Ranking over Global Sequence**: For sectional tests and question banks, evaluation is based on the item's relative rank *within its subject group* rather than its global database sort order. This guarantees balanced exposure across the entire syllabus.
2. **Decoupled Global Pass vs Exam-Specific Pass**: Tier 3 (Super Pass) is treated as a global platform membership. Individual exam edit modals only configure what is specific to that exam (Tier 1 & Tier 2).
3. **Fail-Safe Metadata Hydration**: Exam metadata is resolved with a robust fallback chain (`item.rawDescription` ➔ `item.pricingConfig` ➔ direct fields), ensuring `isPremium` and pricing inputs always load accurately.

---

## Problems solved

1. **Starter Pack Subject Exhaustion**: A 5-test limit previously consumed all slots on Subject #1 (*Anatomy*), leaving all subsequent subjects locked. Fixed via subject-relative ranking in `entitlementEngine.ts` and `App.tsx`.
2. **Price Discrepancy on Checkout**: Fixed `examService.ts` mapping so cleaned descriptions do not strip pricing JSON, ensuring ₹149 exam price renders accurately.
3. **Toggle Defaulting to OFF on Edit**: Resolved `handleEditClick` checking `item.description` instead of `item.rawDescription`, restoring accurate `isPremium` toggle state on edit.

---

## Current state

- **Build Status**: `npm run build` passes with **0 errors (Exit code 0)**.
- **Git Repository**: All changes pushed to `origin/main` (latest commit `cc5c5d9`).
- **Functionality**: 3-tier dynamic pricing, granular starter controls, balanced subject unlocking, and automated expiration tracking are active and verified.

---

## What comes next

1. **Strategy 5 (Post-Exam "Download Test PDF with Solutions")**: Enable candidates to download a formatted, branded PDF with complete step-by-step solutions after completing a mock test.
2. **Mobile Layout Optimization Deep Pass**: Fine-tune touch targets and responsive card layouts across small viewports.

---

## Open questions

- None currently pending.
