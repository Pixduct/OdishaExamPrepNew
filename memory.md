# Memory — Current Affairs Engine Upgrades & 2-Hour Green Zone Scheduling

Last updated: 2026-08-20T00:15:30+05:30

## What was built

### 1. Senior Examiner Cognitive Benchmark & Rejection Engine (`automations/ca_formatter.py`)
- Upgraded the AI system prompt to adopt the cognitive decision mindset of a Senior Exam Paper Setter.
- Added strict High-Value vs. Low-Value rejection benchmarks (`REJECT`).
- Added non-exam noise patterns in `validate_slide_quality()` for interim ED seizures, handwritten notes, vegan diets, routine police raids, political mudslinging, and minor accidents (e.g. Brazil bus crash automatically rejected).

### 2. Dynamic 3 to 5 Bullet Point Generator (Minimum 3 Mandatory) (`automations/ca_formatter.py`)
- Standardized AI bullet generation to require at least 3 mandatory base bullets and allow autonomous expansion to a 4th or 5th bullet point for complex, high-yield news items.

### 3. Dynamic & Natural Bullet Headings (2-4 Words — No Rigid Labels) (`automations/ca_formatter.py`)
- Eliminated hardcoded rigid generic labels (`Key Development / Objective:`, `Background / Location:`, `Exam Significance / Impact:`).
- AI autonomously generates story-matched dynamic bold headings (2-4 words) tailored directly to the story's core facts (e.g. `Varuna Naval Exercise 2026:`, `Strategic Maritime Importance:`, `Constitutional Mandate:`, `Species Discovery & Habitat:`).

### 4. Dual-Context Evaluation Benchmark (`automations/ca_formatter.py`)
- Differentiates Central/National Exams (macro-level developments, national policies, legal milestones, constitutional law) vs. State Exams (OPSC/OSSC state-specific policies, regional infrastructure, governance, and cultural milestones).

### 5. 2-Hour Interval Off-Peak Green Zone Schedule (`automations/.github/workflows/daily_ca.yml` & `daily_ca_website.yml`)
- Configured Telegram/YouTube engine (`daily_ca.yml`) to run once every 2 hours at green zone minute 23 (`23 */2 * * *`, 12 runs/day).
- Configured Website Publisher (`daily_ca_website.yml`) to run once every 2 hours at green zone minute 47 (`47 */2 * * *`, 12 runs/day).

### 6. Zero Ellipsis Caption Headline Rewriter (`automations/ca_publisher.py` & `ca_formatter.py`)
- Implemented `shorten_headline_without_truncation()` to trim long headlines at clean word boundaries under 48 characters without appending `...` or ellipses.
- Guaranteed 100% complete, un-truncated caption headlines for Telegram and YouTube Community posts.

### 7. UI Registry & Documentation Synchronization (`context/ui-registry.md` & `progress-tracker.md`)
- Registered `AiMentorWorkspace` (#57) in `context/ui-registry.md`.
- Updated `context/progress-tracker.md` with all completed milestones.
- Submodules and parent repository committed and pushed to GitHub main branch.

## Decisions made

- **Zero Ellipsis Policy**: Telegram and YouTube Community captions must never contain `...` or ellipsis truncation. Headlines must be rewritten under 48 characters as complete grammatical titles.
- **Dynamic 2-4 Word Headings**: Bullets inside visual cards must use dynamic bold headings tailored to the news item rather than static fixed templates.
- **Green Zone Cron Offsets**: GitHub Actions cron schedules must use off-peak minutes (`23` and `47`) to bypass queue delays on the hour.

## Problems solved

- Eliminated title truncation (`...`) in Telegram captions.
- Prevented repetitive fixed bullet labels across slide carousels.
- Resolved low-relevance noise inclusion in daily current affairs runs.
- Prevented GitHub Actions cron runner queue delays by shifting to off-peak green zone minutes.

## Current state

- All Current Affairs pipelines (formatting, 3-5 dynamic bullets, zero-ellipsis captions, Telegram broadcast, YouTube Community posting, 2-hour cron workflows) are 100% verified working live, tested end-to-end, committed, and pushed to GitHub main branch.

## Next session starts with

- Proceed with any new features, UI component additions, or automation updates requested by the user.

## Open questions

- None.
