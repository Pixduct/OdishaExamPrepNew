# Memory — Channel Automations, Cross-Platform CTA Engine & Multi-Platform Publishing (v3.9.2)

Last updated: 2026-08-14T17:54:15+05:30

## What was built

### 1. Cross-Platform CTA Cross-Promotion Engine across All Workflows
- **Telegram Posts Cross-Promotion**: Updated `ca_publisher.py`, `mcq_engine.py`, and `engagement_engine.py` to append both official Website Link (`https://www.odishaexamprep.in/`) AND YouTube Channel Link (`https://www.youtube.com/@OdishaExamPrep365`) to all Telegram posts.
- **YouTube Posts Cross-Promotion**: Updated `post_to_youtube.py` (`post_to_youtube` and `post_to_youtube_poll`) to append both official Website Link (`https://www.odishaexamprep.in/`) AND Telegram Channel Link (`https://t.me/OdishaExamPrepOfficial`) to all YouTube Community posts.
- **Zero-Truncation Budget Guard**: `build_bulletproof_caption()` in `ca_publisher.py` pre-calculates combined header and CTA footer lengths under Telegram's 1024-character budget.

### 2. Workflow 4 — Strategic Engagement Engine (`automations/engagement_engine.py`)
- **Target Exam Prioritization & DuckDuckGo Educational Research**: Reads daily target exams from Google Sheets (`Engagement_Posts` tab) and executes educational concept searches using `duckduckgo-search`, filtering out administrative news (admit cards, results).
- **3-Stage Fallback Cascade**: Priority 1 (Exam-Specific Concept) ➔ Priority 2 (Exam-Preparation Strategy) ➔ Priority 3 (Universal Aspirant Engagement).
- **AI Quality Gate & Deduplication**: DeepSeek AI validates content against 6 metrics (Educational Value >= 7, Curiosity >= 7, Repetition Risk <= 3) and checks persistent history in `published_history.json`.
- **Telegram Regular Text Poll Mode (`type="regular"`)**: Sends open text polls (0 green checkmarks, 0 red X's) so students can vote freely.
- **Follow-up Strategy Insights & Rotational Student Promo Cards**: Automatically attaches `student 1.png` - `student 7.png` via Telegram `sendPhoto` API based on day of week (`datetime.now().isoweekday()`), followed by strategy insights and cross-promotion CTA.
- **YouTube Community Text Poll (`post_to_youtube.py`)**: Uses Playwright automation (`add a text poll`) with scoped option input fields (`#poll-editor`) and dynamic `Add another option` button clicking for 4 clean option fields (Option A, B, C, D) without pre-marked correct answers.
- **Daily Automated Schedule (`.github/workflows/engagement_engine.yml`)**: Runs daily at `06:07 UTC` (11:37 AM IST).

### 3. Daily 5-MCQ Quiz Set Engine (`automations/mcq_engine.py`)
- **Poll Indexing & Branding**: Indexed daily polls as `[1/5]` through `[5/5]`.
- **Conversion CTA & Rotational Student Promo Cards**: Daily completion banner with 7 rotational student promotion photos (`student 1.png` - `student 7.png`).
- **GitHub Schedule (`daily_mcq.yml`)**: Runs daily at `04:17 UTC` (9:47 AM IST).

### 4. Daily Current Affairs Engine (`automations/ca_publisher.py`, `ca_scraper.py`, `ca_formatter.py`, `ca_renderer.py`)
- **Live Multi-Source Scraper (`ca_scraper.py`)**: Scrapes 6 real-time RSS feeds (PIB Odisha, PIB National, The Hindu, Indian Express, Times of India, BBC World).
- **Persistent Deduplication (`seen_ca_news.json`)**: 60-day history tracking prevents repeating news items.
- **Dynamic 100% Emoji-Free Graphic Decks (`ca_renderer.py`)**: Category badges in rounded pills (`border-radius: 30px;`), dynamic palette wheel (`EXAM`, `SCHEMES`, `APPOINTMENTS`, `ECONOMY`, `SPORTS`, `SCIENCE`, `DEFENCE`), 7 daily layout variants, signature logo icon.
- **GitHub Schedule (`daily_ca.yml`)**: Runs daily at `14:17 UTC` (7:47 PM IST).

### 5. Imprinting & Documentation Sync
- **`context/ui-registry.md`**: Section 42 (`CurrentAffairsGraphicEngine`), Section 43 (`StrategicEngagementEngine`), and Section 44 (`CrossPlatformCTAPromotionEngine`).
- **`context/architecture.md`**: Channel Automations Architecture.
- **`context/progress-tracker.md`**: Version `3.9.2`.

## Decisions made
- **Symmetric Cross-Platform Growth**: Every Telegram post drives traffic to YouTube (`@OdishaExamPrep365`), and every YouTube post drives traffic to Telegram (`@OdishaExamPrepOfficial`), while both consistently prioritize the official website (`www.odishaexamprep.in`).
- **Open Text Poll Engagement**: Workflow 4 uses `type="regular"` on Telegram and `add a text poll` on YouTube Community so students engage with study strategy polls without getting marked incorrect.
- **Direct Photo Attachment for Rotational Promo**: Telegram strategy insights messages use `sendPhoto` with `student {dayOfWeek}.png` directly to bypass Telegram OpenGraph link preview caching.
- **YouTube DOM Option Scoping**: Scoped text poll option inputs inside `#poll-editor` and `ytd-select-poll-type-post-renderer` with single-assignment event dispatching to avoid duplicate text typing or search bar element overlap.
- **Persistent Deduplication**: `published_history.json` and `seen_ca_news.json` are automatically committed back to GitHub Actions after every run.

## Problems solved
- **Cross-Promotion Gap**: Added YouTube links to Telegram posts and Telegram links to YouTube posts across all 4 automated workflows.
- **YouTube Quiz vs Text Poll Distinction**: Converted Workflow 4 from Quiz mode to Text Poll mode on YouTube Studio, selecting `add a text poll` and removing correct answer radio button selections.
- **Missing Option C & D on YouTube Text Polls**: Fixed by adding dynamic loop for `Add another option` button clicks until all 4 option inputs render in YouTube Studio's composer.
- **Duplicated Option Text on YouTube**: Fixed by using DOM property assignment with native `input` and `change` event dispatching instead of duplicate keyboard typing.
- **Telegram Link Preview Image Caching**: Resolved by sending direct `sendPhoto` attachments for daily student promo images.
- **Telegram CTA Truncation**: Resolved by `build_bulletproof_caption()` budget pre-calculations.

## Current state
- TypeScript check: **0 compilation errors** (`npx tsc --noEmit` passes cleanly).
- Repositories: All changes pushed to `https://github.com/Pixduct/odisha-mcq-engine.git` and `https://github.com/nareshsamal99384-cpu/OdishaExamPrepWebsite.git`.
- Workflows: `daily_mcq.yml`, `daily_ca.yml`, and `engagement_engine.yml` passing cleanly on GitHub Actions with 100% success.

## Next session starts with
- Monitor live daily GitHub Actions automated runs:
  - MCQ Polls: `04:17 UTC` (9:47 AM IST)
  - Strategic Engagement Engine: `06:07 UTC` (11:37 AM IST)
  - Current Affairs Decks: `14:17 UTC` (7:47 PM IST)
- Proceed with any new features, UI refinements, or administrative tools requested by the user.

## Open questions
- None.
