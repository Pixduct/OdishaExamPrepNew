# Memory — Telegram AI Model Reporting & GitHub Actions Workflow Optimization

Last updated: 2026-08-18T10:45:00+05:30

## What was built

### 1. Telegram AI Model Usage Reporting Across All 6 Automation Engines
- **Transparent AI Reporting:** Updated all 6 python automation scripts (`ca_formatter.py`, `ca_publisher.py`, `breaking_engine.py`, `engagement_engine.py`, `seo_blog_engine.py`, `exam_update_engine.py`) and `shared/telegram.py` to track and report the exact model used.
- **Admin Alerts:** Every Telegram admin notification now clearly shows whether the primary model or fallback model was used:
  - `🤖 AI Model: ✅ PRIMARY — nvidia/nemotron-3-super-120b-a12b`
  - `🤖 AI Model: ⚠️ FALLBACK — openai/gpt-oss-120b`

### 2. GitHub Actions Workflow Reliability Audit & Timeout Fixes
- **`daily_ca_website.yml` & `ca_website_publisher.py`:** Resolved GitHub Actions timeout cancellation `(!)` by adding an 8-item batch cap (`MAX_ITEMS_PER_RUN = 8`), a 10-minute script runtime guard (`MAX_RUN_TIME_SECONDS = 600`), reducing AI API timeouts from 90s to 40s, and extending workflow timeout to 30 minutes.
- **Standardized Permissions:** Added `permissions: contents: write` across all 7 workflow files to ensure automated git history commits never fail with HTTP 403.
- **Complete Secret Mappings:** Mapped `PEXELS_API_KEY`, `NVIDIA_NEMOTRON_KEY`, `NVIDIA_GPT_OSS_KEY`, and `DEEPSEEK_API_KEY` across all workflows that fetch stock images or run dual-model AI failover.
- **History Sync for `daily_mcq.yml`:** Added automated `Commit and Push Updated History` step to `daily_mcq.yml` so MCQ deduplication records persist across runs.
- **Playwright Browser Cache Optimization:** Updated `daily_ca.yml`, `daily_mcq.yml`, and `engagement_engine.yml` with `cache-hit` checks (`if [ "$CACHE_HIT" != "true" ]`), skipping the 150MB Chromium download when cached and saving 30–45s per run.

### 3. GitHub Actions Runtime & Quota Audit
- **30-Day Budget Analysis:** Verified that all 7 workflows combined consume ~982.5 minutes/month, staying well under the 2,000 free minute quota for private repositories (and 0 cost if public).

## Decisions made
- **Dual-Model Reporting:** Always pass `model_used` and `used_fallback` into Telegram `details` dictionaries to provide full visibility into AI execution.
- **Script-Level Runtime Guards:** Place 10-minute execution limits inside Python processing loops so scripts exit cleanly and save history to Git before workflow timeout limits trigger.
- **Conditional Browser Caching:** Use `actions/cache@v4` for Playwright Chromium binaries with explicit `cache-hit` checks to maximize workflow execution speed.

## Problems solved
- **Workflow Timeout Cancellation `(!)`:** Fixed the issue where `daily_ca_website.yml` timed out at 15 minutes and was cancelled by GitHub Actions due to un-capped processing loops.
- **Missing Secrets in Workflows:** Restored missing `PEXELS_API_KEY` and `NVIDIA_NEMOTRON_KEY` mappings in workflow files.
- **MCQ History Persistence:** Resolved missing history sync step in `daily_mcq.yml`.

## Current state
- 100% clean Python syntax verified (`py_compile` exit code 0 across all automation scripts).
- All changes committed and pushed to GitHub (`Pixduct/odisha-mcq-engine` and `Pixduct/OdishaExamPrepNew`).

## Next session starts with
- Assist the user with any new feature requests, automation monitoring, or UI enhancements.

## Open questions
- None.
