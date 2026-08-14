# Memory — Channel Automations, Dynamic Branding & Multi-Platform Publishing Engine (v3.9.0)

Last updated: 2026-08-14T14:52:00+05:30

## What was built

### 1. Daily 5-MCQ Quiz Set Engine (`automations/mcq_engine.py`)
- **Poll Indexing & Branding**: Indexed daily polls as `[1/5]`, `[2/5]`, `[3/5]`, `[4/5]`, `[5/5]`.
- **Conversion CTA**: Added explanation CTA bubble driving traffic to `https://www.odishaexamprep.in/`.
- **7-Day Rotational Student Promo Photos**: Attached **Daily Completion Banner** with 7 rotational student promotion photos (`student 1.png` - `student 7.png`).
- **Sheet Sync & Schedule**: Runs off-peak at `04:17 UTC` (9:47 AM IST) on GitHub Actions (`daily_mcq.yml`) with Playwright caching under 40 seconds; announced publicly at 10:00 AM IST.

### 2. Daily Current Affairs Engine (`automations/ca_publisher.py`, `ca_scraper.py`, `ca_formatter.py`, `ca_renderer.py`)
- **Live Multi-Source Scraper (`ca_scraper.py`)**: Scrapes 6 real-time RSS feeds (PIB Odisha, PIB National, The Hindu, Indian Express, Times of India, BBC World).
- **Persistent Deduplication (`seen_ca_news.json`)**: 60-day history tracking prevents repeating news items. Automatically committed back to GitHub via Actions (`[skip ci]`). Includes 7 rotating fallback datasets (Mon-Sun).
- **Dynamic Future-Proof Category Engine (`ca_renderer.py` & `ca_formatter.py`)**:
  - 100% Emoji-Free Pill Badges (`border-radius: 30px;`) matching user's exact reference screenshot.
  - Yellow arrow `►` keypoint bullets with bold labels (`<b>Financial Outlay:</b>`).
  - Dynamic palette wheel: `EXAM` ➔ Red, `SCHEMES` ➔ Indigo, `APPOINTMENTS` ➔ Emerald, `ECONOMY` ➔ Cyan, `SPORTS` ➔ Gold, `SCIENCE` ➔ Purple, `DEFENCE` ➔ Orange + string hash fallback.
  - 7 Daily Layout Variants (Mon: Hero Grid, Tue: Split Accent, Wed: Halo Glow, Thu: Nordic Frame, Fri: Banner Ribbon, Sat: Blueprint Grid, Sun: Gold Rimmed).
  - Constant signature blue-indigo logo icon (`#6366F1` ➔ `#3B82F6`) + `Daily CA Quiz & Practice 🚀` right-side footer text.
- **HTML Caption Parser (`clean_html_caption`)**: Auto-balances truncated `<b>` or `<i>` tags before sending to Telegram, eliminating `Error 400: Unclosed end tag` failures.
- **Multi-Platform Publishing**: Automatically posts to Telegram Public Channel (`@OdishaExamPrepOfficial`), YouTube Community, and reports status to `Odisha Prep Admin Bot` (`[REDACTED_CHAT_ID]`).
- **GitHub Schedule**: Runs off-peak at `14:17 UTC` (7:47 PM IST) on GitHub Actions (`daily_ca.yml`); announced publicly at 8:00 PM IST.

### 3. Server OpenGraph Rotational Student Images (`server.ts`)
- Configured `server.ts` to dynamically serve `student {dayOfWeek}.png` (`student 1.png` to `student 7.png`) for OpenGraph `og:image` tags when sharing on social media.

### 4. Code Base Imprinting & Documentation Sync
- **`context/ui-registry.md`**: Added Section 42 (`CurrentAffairsGraphicEngine` & `AutomatedMCQEngine`).
- **`context/architecture.md`**: Added Section `Channel Automations & Social Media Graphic Engine Architecture`.
- **`context/progress-tracker.md`**: Updated project version to `3.9.0`.

## Decisions made
- **Green Zone Off-Peak Execution**: Scheduled GitHub Actions crons 13 minutes early (`04:17 UTC` & `14:17 UTC`) to run during low-traffic GitHub queue windows, avoiding queue delays while announcing public times (10:00 AM IST & 8:00 PM IST).
- **100% Emoji-Free Pill Badges**: Category badges use clean uppercase text in rounded pills (`border-radius: 30px;`), matching user's exact visual reference.
- **Dynamic Category Mapping**: AI model (`deepseek-chat`) is empowered to generate any accurate category label (`SPORTS & GAMES`, `DEFENCE & SECURITY`, `SCIENCE & SPACE`, `SCHEMES & POLICIES`), which `ca_renderer.py` maps dynamically to a vibrant color palette.
- **Persistent Deduplication Storage**: `seen_ca_news.json` is committed back to GitHub after every run so history persists across ephemeral CI runners.

## Problems solved
- **Telegram HTML Caption Truncation Error (400)**: Solved via `clean_html_caption` tag-closing parser in `ca_publisher.py`.
- **YouTube Skipped Warning**: Solved by removing `yt_state.json` from `.gitignore`, adding `YOUTUBE_STORAGE_STATE` to GitHub Secrets, and restoring session state during workflow runs.
- **Duplicate News Repetition**: Solved by implementing `seen_ca_news.json` deduplication cache in `ca_scraper.py` and `ca_formatter.py`.
- **Static Category Limitation**: Solved by introducing dynamic keyword-to-color mapping and string hashing palette fallback in `ca_renderer.py`.

## Current state
- TypeScript check: **0 compilation errors** (`npx tsc --noEmit` passes cleanly).
- Automation Repositories: All commits pushed to `https://github.com/Pixduct/odisha-mcq-engine.git` and `https://github.com/nareshsamal99384-cpu/OdishaExamPrepWebsite.git`.
- GitHub Actions Workflows: `daily_mcq.yml` and `daily_ca.yml` passing cleanly with 100% success.

## Next session starts with
- Monitor live daily workflow executions for MCQ Polls (10:00 AM IST) and Current Affairs Decks (8:00 PM IST).
- Proceed with any new features, UI refinements, or administrative tools requested by the user.

## Open questions
- None.
