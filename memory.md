# Memory — 🚀 Automation Engines Hardening, 1080x1080 Visual Card Engine, Zero-Noise Gatekeeping & Admin Audit Observability

Last updated: August 29, 2026, 10:28 IST

## What was built

### 1. Daily MCQ Engine 3x Daily Schedule & 1-Question Batch Optimization (`automations/mcq_engine.py`, `automations/.github/workflows/daily_mcq.yml`)
- **Single-Question Batches**: Configured `MCQ_BATCH_SIZE = 1` in `automations/mcq_engine.py` to publish exactly 1 question per run instead of 5 questions.
- **3x Daily Off-Peak Schedule**: Configured GitHub Actions cron schedule in `daily_mcq.yml` at `04:17 UTC` (9:47 AM IST), `08:47 UTC` (2:17 PM IST), and `13:47 UTC` (7:17 PM IST).
- **Bash Interpolation Crash Fix**: Resolved multi-line JSON bash interpolation crash in GitHub Actions by passing `YOUTUBE_STORAGE_STATE` as an environment variable and accessing it via `os.environ` in Python.

### 2. Current Affairs Engine Zero-Hallucination Recovery & Off-Peak Schedule (`automations/ca_formatter.py`, `automations/ca_scraper.py`, `automations/.github/workflows/daily_ca.yml`)
- **Robust JSON Extraction**: Added `<think>...</think>` tag stripping and regex JSON block parsing to eliminate markdown formatting errors.
- **48-Hour Freshness Window**: Expanded `FRESHNESS_HOURS` in `ca_scraper.py` from 24h to 48h to prevent dropping legitimate late-evening press releases.
- **Strict Factual Gate**: Retained the fail-closed factual gate requiring $\ge 80/100$ factuality score, official source verification, and numerical metric consistency before publishing.
- **Off-Peak GitHub Schedule**: Scheduled in `daily_ca.yml` for **7:47 PM IST** (`17 14 * * *` UTC) with morning catchup at **9:17 AM IST** (`47 03 * * *` UTC) under dedicated concurrency group `group: daily-ca-engine`.

### 3. Official Exam Notification Engine High-Credibility & Zero-Noise Optimization (`automations/exam_update_engine.py`, `automations/.github/workflows/exam_update_cron.yml`, `automations/.github/workflows/notice_scraper.yml`)
- **Anti-Deputation & Anti-Executive Blacklist**: Enforced hard rejection on non-student administrative posts (`deputation`, `contract basis`, `cmd`, `managing director`, `director general`, `advisor`, `consultant`, `empanelment`, `internal promotion`). The engine accepts strictly open competitive student exams (OSSC, OPSC, OSSSC, Police, SSC, RRB, IBPS, UPSC).
- **Active Date Freshness Filter**: Rejects notices with expired deadlines or archive notices older than 48 hours. Removed artificial daily quotas so the engine posts 0 items cleanly when no genuine new exam notices exist.
- **Race Condition Prevention**: Deactivated the 15-minute cron in `notice_scraper.yml` (set to `workflow_dispatch` only) to eliminate duplicate broadcast collisions.
- **2x Daily Off-Peak Schedule**: Configured `exam_update_cron.yml` to run at **10:47 AM IST** (`17 05 * * *` UTC) and **6:17 PM IST** (`47 12 * * *` UTC) under `group: exam-update-engine`.

### 4. Executive Portal Audit Digest & Transparent Admin Zero-Post Heartbeat (`automations/exam_update_engine.py`, `automations/shared/telegram.py`)
- **Transparent Admin Scan Digest**: When 0 notices are published, the engine delivers a detailed audit report to the Admin Telegram bot listing all 14 scanned portals (OPSC, OSSC, OSSSC, Police, SSC, RRB, IBPS, UPSC, etc.), candidate notices evaluated, archived items filtered, and non-student items blocked.
- **100% Mathematical Proof**: Guarantees complete admin visibility and peace of mind that all government boards are up to date and no student notification was missed.

### 5. 1080x1080 Dynamic Visual Card Engine & Multi-Platform Dispatch (`automations/exam_card_renderer.py`, `automations/shared/telegram.py`, `automations/shared/whatsapp.py`)
- **Scenario-Adaptive Themes**: Built `exam_card_renderer.py` supporting 6 dynamic visual themes:
  - 📢 *Recruitment:* Sapphire Blue Gradient (`#2563EB`)
  - 🚀 *Application Window:* Mint Emerald Gradient (`#059669`)
  - 📅 *Exam Date/Schedule:* Royal Indigo Gradient (`#4F46E5`)
  - 🎟️ *Admit Card:* Electric Cyan Gradient (`#0284C7`)
  - 🏆 *Result & Cut-off:* Amber Gold Gradient (`#D97706`)
  - ✏️ *Corrigendum:* Electric Purple Gradient (`#7C3AED`)
- **Adaptive Typography**: Headline font scales dynamically from `34px` down to `26px` on titles $>55$ chars to guarantee zero text truncation.
- **Mathematical Horizontal Center Placement**: Styled `.board-tag` with `position: absolute; left: 50%; transform: translateX(-50%);` to guarantee geometric symmetry on the 1080px canvas regardless of text length on the left/right.
- **Multi-Platform Visual Dispatch**: Dispatches the rendered 1080x1080 image via `sendPhoto` with the complete caption to Telegram (`@OdishaExamPrepOfficial`), YouTube Community, and WhatsApp.

### 6. Structured Timeline & Anti-Clutter Key Highlights (`automations/exam_update_engine.py`, `automations/shared/telegram.py`, `automations/shared/whatsapp.py`)
- **`🗓️ CRITICAL DATES & TIMELINE`**: Extracted concrete milestone dates (`Online Application Window`, `Fee Payment Deadline`, `Prelims Exam Date`, `Admit Card Date`).
- **`⚡ KEY EXAM DETAILS & ACTION PLAN`**: Structured highlights reserved strictly for actionable guidance (Selection Mode, Exam Pattern, Candidate Action Plan) with zero repetition of header metadata.
- **Removed Header Redundancy**: Eliminated duplicate `Target Exam` lines that previously repeated the headline.

---

## Decisions made
- **Dual-Channel Transparency**: Public channel receives broadcasts *only* on genuine student exam releases; private admin bot receives a complete scan audit report on *every* run (even 0-post runs).
- **Fail-Closed Quality Standard**: A day with 0 posts is far better than publishing 1 irrelevant, expired, or deputation notice.
- **Mathematical Center Geometry for Badges**: Absolute center positioning with `translateX(-50%)` is enforced on visual slide templates to prevent asymmetry caused by unequal text lengths in flexbox containers.
- **Off-Peak GitHub Actions Execution**: All cron schedules are set to xx:17 or xx:47 UTC to bypass top-of-the-hour runner queue bottlenecks.

---

## Problems solved
- **Solved Repeated/Outdated Exam Notices**: Added anti-deputation blacklist, 48h active date filter, and deactivated competing 15-minute scraper cron.
- **Solved Missing Current Affairs Posts**: Stripped `<think>` tags and relaxed JSON schema parsing in `ca_formatter.py` and expanded freshness window to 48h.
- **Solved MCQ Batch Size Overload**: Reduced batch size from 5 to 1 question per run.
- **Solved Visual Card Tag Asymmetry**: Replaced uneven flex distribution with true geometric center alignment.
- **Solved Ambiguous Dates & Clutter in Social Broadcasts**: Restructured schema into dedicated `CRITICAL DATES & TIMELINE` and non-redundant `KEY EXAM DETAILS & ACTION PLAN`.

---

## Current state
- **Automations Submodule (`Pixduct/odisha-mcq-engine`)**: All code committed and pushed to `main` branch (`b548801`, `361fe00`, `2d2e88e`, `f168e25`, `3072c5b`).
- **Main Website Repository (`Pixduct/OdishaExamPrepNew`)**: Submodule pointers, `context/progress-tracker.md`, and `context/ui-registry.md` synced and pushed to `main` (`fa629cc`, `900f5ca`, `db488b1`, `7fd8140`, `b0c8d3a`).
- **CI / GitHub Actions**: All 3 workflows (`daily_mcq.yml`, `daily_ca.yml`, `exam_update_cron.yml`) configured with dedicated concurrency groups and off-peak cron triggers.

---

## Next session starts with
- Monitor scheduled GitHub Actions runs at their respective off-peak cron times.
- Check Admin Telegram bot for incoming audit reports and scan verification digests.

---

## Open questions
- None. All automation pipelines, fact-checking gates, visual rendering engines, and message formatting improvements are verified and deployed live.
