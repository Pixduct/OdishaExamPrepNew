# Memory — 20-Category Exam Notification Alert Engine & Dedicated Visual Themes

Last updated: 2026-08-19T18:48:00+05:30

## What was built

### 1. 20-Category Strict Exam Alert Gatekeeper (`automations/breaking_engine.py`)
- Configured an exhaustive 20-category classification and styling matrix (`EXAM_CATEGORIES_CONFIG`):
  1. *Exam Notification / Official Notification Released*
  2. *Application Form Start*
  3. *Application Form Last Date*
  4. *Last Date Extended*
  5. *Correction Window Open / Extended*
  6. *Admit Card Released*
  7. *Exam Date Announced*
  8. *Exam Date Changed / Rescheduled*
  9. *Exam Cancelled / Postponed*
  10. *Exam City / Centre Intimation*
  11. *Answer Key Released*
  12. *Answer Key Revised / Final Answer Key*
  13. *Objection Window Open / Extended*
  14. *Result Released*
  15. *Cut-off / Merit List Released*
  16. *Scorecard Released*
  17. *Document Verification / Counselling Schedule*
  18. *Interview / Skill Test / Physical Test Date*
  19. *Final Selection List / Final Result*
  20. *Important Notice / Official Update*
- **AI Filtering**: Injected prompt rules ensuring routine internal noise (tenders, staff transfers, auctions, obscure circulars) is strictly classified as `REJECT` and skipped, with a diagnostic message sent to Admin DM.

### 2. Dedicated 1080x1080 Visual Layouts per Category (`automations/templates/template_alert.html`)
- Upgraded the HTML template to dynamically support unique visual styling per category:
  - 3-Stop Ambient Radial Background Lighting (`THEME_BG_COLOR`, `THEME_RADIAL_1`, `THEME_RADIAL_2`).
  - High-Impact Category Pill Badges (`THEME_BADGE_GRADIENT`, `THEME_GLOW_COLOR`).
  - Border Accents & Glowing Shadows (`THEME_BORDER_COLOR`, `THEME_ACCENT_COLOR`, `THEME_BULLET_ICON`).
  - Prominent Exam Board Name & Authority Tag (`BOARD_NAME_SHORT`, `EXAM_BOARD_FULL`).
  - Direct Official Portal Domain Strip at the bottom of the card (`OFFICIAL_SOURCE_DOMAIN`).

### 3. Standalone High-Value Caption Builder & Zero Fake Blog Links (`automations/breaking_engine.py` & `automations/shared/telegram.py`)
- Removed fake/broken fallback blog URLs (`/blog/generated-uuid`).
- Embedded the **direct official government notice URL** into all alerts for seamless 1-click access to official notice PDFs.
- Standardized rich bullet highlights with bold labels (`<b>Exam Date:</b>`, `<b>Admit Card:</b>`, `<b>Total Vacancies:</b>`, `<b>Official Portal:</b>`).

### 4. Guaranteed Private Admin Bot DM Delivery (`automations/shared/telegram.py` & `automations/breaking_engine.py`)
- Hardcoded fallback `TELEGRAM_ADMIN_CHAT_ID = "1317595163"` across all alert engines.
- Whenever an alert is published, the bot dispatches the rendered 1080x1080 photo card plus full execution diagnostic (Category, Board, Headline, Official Source URL, AI Model Used, Public Broadcast Status) directly to the platform admin's private Telegram chat (`1317595163`).

### 5. Imprinted UI Patterns & Progress Tracker Updated
- Registered Entry #51 `ExamAlertGraphicCard` in `context/ui-registry.md`.
- Updated `context/progress-tracker.md` with task completion.

## Decisions made
- **Strict 20-Category Gatekeeper**: Only notices that squarely fit into one of the 20 approved exam categories are broadcast; all other notices are rejected to maintain top-tier channel content quality.
- **Standalone Alert Independence**: Notification alerts operate completely independently of website blog posts and do not include or require website blog URLs.
- **Direct Official Source Redirection**: Alerts always provide the direct government link/PDF so students are redirected straight to the official notification document.
- **Dual Broadcast Pipeline**: Public Telegram Channel gets the clean visual card + student caption; Admin DM (`1317595163`) receives the visual card + complete backend execution summary.

## Problems solved
- **Generic / Trash Content in Notification Alerts**: Replaced boilerplate placeholders with category-specific AI extraction.
- **Outdated / Unrelated Image Previews (IIT-JEE Student Photo)**: Eliminated fallback URL crawls and replaced them with category-themed 1080x1080 PNG graphic cards.
- **Broken `/blog/generated-uuid` Links**: Removed fake blog link reliance.
- **Missing Admin DM Bot Notifications**: Corrected default `TELEGRAM_ADMIN_CHAT_ID` to `"1317595163"`.

## Current state
- All 20 categories tested and verified with both rule-based and AI classification engines.
- Sample category executions tested cleanly via Python test harness.
- `context/ui-registry.md` and `context/progress-tracker.md` fully synchronized.

## Next session starts with
- Ready for any new feature, frontend update, exam content curation, or automation engine directive.

## Open questions
- None.
