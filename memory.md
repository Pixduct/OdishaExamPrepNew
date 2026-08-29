# Memory — 📝 Enterprise Google Sheet Editorial Queue, Drive Image Sanitizer & 6-Archetype Dynamic Masterclass Engine

Last updated: August 29, 2026, 15:25 IST

## What was built

### 1. Google Sheet Editorial Queue Ingestion (`automations/shared/google_sheet_queue.py`)
- **Automated Queue Polling**: Connects via `gspread` and service account credentials to `Odisha_Editorial_Queue`, `Odisha_Blog_Queue`, or `Blog_Queue` tab to fetch pending custom articles.
- **Expected Columns**: `Target_Exam`, `Title`, `Image_URL`, `Focus_Notes`, `Status`, `Published_URL`, `Published_At`.
- **Bi-Directional Status Tracking**: On successful publication, automatically transitions row status from `Pending` to `Published` and writes back the live article URL (`https://www.odishaexamprep.in/blog/<id>`) and timestamp with exponential backoff retries.

### 2. Enterprise Image Sanitizer & Drive Resolver (`automations/shared/drive_image_sanitizer.py`)
- **Google Drive Stream Conversion**: Converts Google Drive share URLs (`/file/d/<id>/view` or `id=<id>`) to direct raw image binary streams (`export=download&id=<id>`), handling Google confirmation cookies and downloading valid image binaries.
- **Zero-Chopsticks Fallback**: Completely removed the hardcoded stock photo fallback (`pexels-photo-5905712`). If no image link is provided in a sheet row, the engine dynamically generates an official high-resolution 1200x630 branded vector banner via `shared/exam_logo_registry.py`.

### 3. Intent-Adaptive 6-Archetype Content Engine (`automations/seo_blog_engine.py`)
- **Dynamic Content Classifier**: Analyzes incoming custom titles and focus notes, matching them into one of 6 specialized editorial archetypes:
  1. 💰 **Salary, Perks & Hierarchy** (`SALARY_PROFILE`): 7th Pay Commission pay matrix, itemized in-hand salary table (Basic, DA, HRA, NPS, Net Pay), government allowances, and 10-year promotion ladder.
  2. 👮 **Job Profile & Lifestyle** (`LIFESTYLE_ROUTINE`): Role prestige, typical daily morning-to-evening routine, field vs. office district postings, operational powers, and work-life balance.
  3. 🗺️ **Preparation Strategy & Roadmap** (`STRATEGY_ROADMAP`): 4-phase preparation blueprint, high-yield topic weightage matrix, daily 6-hour timetable, revision routine, and error-logging framework.
  4. 📚 **Best Books & Study Material** (`BOOKLIST_RESOURCES`): Subject-by-subject standard reference books table, syllabus mapping, textbook vs. PYQ balance, and 1-page revision note methods.
  5. 📊 **Cut-Off Trends & Safe Scores** (`CUTOFF_ANALYSIS`): Previous year category-wise cut-off tables (UR, SEBC, SC, ST), driving factors, safe score blueprints, and normalization formulas.
  6. ⚡ **Subject Shortcuts & Masterclasses** (`SUBJECT_SHORTCUTS`): Speed formulas in clean LaTeX, worked problem comparisons (Standard 90s vs. Topper 20s shortcut), calculation traps, and practice MCQs.
- **Autonomous Fallback**: If the Google Sheet queue is empty or offline, the engine falls back to curated curriculum rotation with official vector banners without crashing.

### 4. UI Pattern Registry & Progress Tracker Updates
- Imprinted `EditorialMasterclassCoverBanner` into `context/ui-registry.md`.
- Updated `context/progress-tracker.md` with all editorial queue milestones.

---

## Decisions made
- **Intent-Driven Flexibility**: The blog engine dynamically structures articles based on topic intent rather than forcing a rigid math formula template onto job profiles or salary breakdowns.
- **Drive Image Sanitization**: All Google Drive share links are sanitized and validated to guarantee 100% reliable OpenGraph previews and Telegram photo cards.
- **Zero-Chopsticks Guarantee**: Prohibited arbitrary stock photo fallbacks across the platform; vector graphics or user-provided images are mandatory.

---

## Problems solved
- **Solved Repetitive Irrelevant Blog Photos**: Replaced the hardcoded woman-with-chopsticks fallback with custom Google Sheet image inputs and official 1200x630 vector banners.
- **Solved Academic / Rigid AI Titles**: Allowed full manual editorial control via Google Sheets, supported by dynamic 6-archetype content generation.

---

## Current state
- **Automations Submodule (`Pixduct/odisha-mcq-engine`)**: All code committed and pushed to `main` (`3f75056`, `b548801`, `361fe00`, `2d2e88e`).
- **Main Website Repository (`Pixduct/OdishaExamPrepNew`)**: Submodule pointers, `context/ui-registry.md`, `context/progress-tracker.md`, and `memory.md` synced and pushed to `main` (`060f216`, `e7ec1b0`, `ca31dfa`).
- **CI / GitHub Actions**: All workflows (`daily_mcq.yml`, `daily_ca.yml`, `exam_update_cron.yml`) operational.

---

## Next session starts with
- Add custom article topics and image links to the Google Sheet (`Odisha_Editorial_Queue` or `Blog_Queue` tab in `Odisha_MCQ_Engine`).
- Monitor automated blog generation and verify published articles on `https://www.odishaexamprep.in/blog`.

---

## Open questions
- None. All requirements for the editorial queue, image sanitizer, and dynamic content synthesis are completed and verified.
