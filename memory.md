# Memory — Workflow 5 Exam Visual Context Intelligence & Smart Image Engine (v4.0.0)

Last updated: 2026-08-14T19:19:00+05:30

## What was built

### 1. Workflow 5 — Two Independent Autonomous Content Engines
- **Engine 1 (`automations/exam_update_engine.py`)**: Autonomous official recruitment notification scraper and publisher running 3 times daily (08:47 AM, 02:47 PM, 08:47 PM IST).
- **Engine 2 (`automations/seo_blog_engine.py`)**: Autonomous strategic evergreen educational article engine running daily at 12:07 PM IST.

### 2. Exam Visual Context Intelligence Layer (`automations/shared/exam_visual_context.py`)
- **Master `EXAM_VISUAL_CONTEXT` Registry**: Maps target exams (OSSSC Nursing Officer, OSSC CGL, OSSSC CTSRE, OPSC, SSC, Railway, Banking, Defence, Teaching, Police) to visual domains, preferred photographic concepts, and negative exclusion keywords.
- **Dynamic Context Inference**: Auto-derives visual domain for unlisted exams (`AIIMS Nursing` -> Nursing, `RRB ALP` -> Technical/Railway, `CTET` -> Teaching).
- **Query Combination**: Combines Exam Context + Article Subject + Real-World Activity (e.g. `"Indian nursing student studying pharmacology textbook"`).

### 3. Smart, Relevant, Copyright-Safe Image Engine (`automations/shared/pexels_image_fetcher.py` & `automations/shared/wikimedia_fetcher.py`)
- **Pexels API Primary Search & 100-Point Scoring**: Scores candidate photos on Exam Match (25%), Article Match (30%), Profession Match (20%), Activity Match (15%), Quality (5%), and Uniqueness (5%).
- **Negative Keyword Filter**: Hard exclusion of home decor and living room furniture (`furniture`, `living room`, `cabinet`, `sofa`, `couch`).
- **Persistent Image History (`automations/published_image_history.json`)**: Tracks `blog_id`, `slug`, `exam`, `content_type`, `image_source`, `image_id`, `image_url`, `photographer`, `search_query`, `published_at` to enforce 30-blog cooldown and previous blog photo ID hard rejection.
- **Secondary Fallback (Wikimedia Commons API)**: Verifies open CC BY / Public Domain licenses and records author, source URL, and license attribution.
- **Hand-Curated Verified Exam Stock Directory**: Fallback pool of 100% verified academic exam desk study, nursing, and technical photos.
- **Safe Failure Mode**: `IMAGE_NOT_FOUND` fallback safely publishes article without forcing an irrelevant image.

### 4. Content Quality Upgrade & Documentation Imprint
- **100-Point Quality Gate (`automations/shared/seo_validator.py`)**: Enforces minimum score of 85/100, 1400–2500+ word depth, HTML Error Log tables, decision frameworks, action checklists, and 4–6 FAQs.
- **Documentation Sync (`context/ui-registry.md`)**: Imprinted Section 45 (`ExamVisualContextImageEngine`).

## Decisions made
- **Two Independent Engines**: Exam update notifications and evergreen educational content operate as two separate autonomous runners sharing common infrastructure.
- **Exam Visual Context Translation**: Translates literal exam acronyms into real-world visual domains (`OSSC CGL` -> Competitive exam study desk, `OSSSC Nursing` -> Healthcare clinical education, `OSSSC CTSRE` -> Technical engineering study).
- **Strict Real Stock Photo Rule**: Zero AI image generation; uses only free stock photography from Pexels API and Wikimedia Commons API.
- **Hard Furniture Exclusion**: Automatically rejects any image tagged with living room furniture or interior decor keywords.
- **Persistent History Sync**: `published_image_history.json` and `used_blog_images.json` are automatically committed back to GitHub Actions after every run.

## Problems solved
- **Generic Campus Student Photos**: Replaced generic university campus images with exact profession-first stock photos matching the exam subject (Nursing, Engineering, Exam Study Desk).
- **Irrelevant Furniture Photos**: Added negative keyword filtering to eliminate living room cabinet/furniture images.
- **Duplicate Pexels Image Selection**: Enforced persistent 30-blog cooldown and previous blog photo ID hard rejection.
- **Missing License Information**: Integrated Wikimedia Commons API with automated CC BY / Public Domain license verification.

## Current state
- Python Compilation: **0 errors** across all automation scripts (`py_compile` passes cleanly).
- Workflows: `.github/workflows/blog_cron.yml` & `.github/workflows/exam_update_cron.yml` configured and verified live on GitHub Actions (`blog_cron.yml` run #31806020997 completed cleanly in 25s).
- Repositories: All code committed and pushed to `Pixduct/odisha-mcq-engine.git` and `nareshsamal99384-cpu/OdishaExamPrepWebsite.git`.

## Next session starts with
- Monitor automated daily execution:
  - Engine 1 (Exam Updates): 08:47 AM, 02:47 PM, 08:47 PM IST.
  - Engine 2 (Evergreen Blogs): 12:07 PM IST.
- Proceed with any new features, UI refinements, or administrative tools requested by the user.

## Open questions
- None.
