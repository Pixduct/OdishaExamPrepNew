# Memory — Official Notification Blogs, URL Resolution, Vector Banner Generator & Blog Typography Engine

Last updated: 2026-08-19T19:42:30+05:30

## What was built

### 1. Dual-Pathway Engaging Masterclass Engine (`automations/seo_blog_engine.py`)
- Redesigned Blog Engine 2 into a high-variety, 27+ topic educational masterclass generator across 7 core academic pillars (Quantitative Aptitude, Data Interpretation, Logical Reasoning, Odia & English Grammar, General Studies/Odisha GK, Test-Taking Strategy, Cognitive Memory).
- **Strict Realism Policy**: Forbids claiming speculative "30-day" or "60-day" countdown plans for unannounced exams. If no official notification is active, the post focuses on universal skill mastery without naming unannounced exams in misleading contexts.
- **5 High-Value Pedagogical Pillars**: Every masterclass includes:
  1. *Trap vs. Shortcut Worked Problem Breakdowns* (at least 2 fully solved problems with common trap warnings and step-by-step shortcuts).
  2. *Custom Topic Reference Matrices* (specialized HTML reference tables).
  3. *Concrete 'If-Then' Decision Heuristics*.
  4. *7-Day Practical Implementation Protocols*.
  5. *4–6 Deep Technical FAQs*.
- **Anti-Repetition Memory Shield**: Queries Supabase and `history/evergreen_content_history.json` to blacklist recently published concepts, formulas, and frameworks from the past 25+ articles.

### 2. Official Exam Board Logo & Dynamic Vector Graphic Engine (`automations/shared/exam_logo_registry.py`)
- Created a deterministic 1200×630px high-density vector card banner generator using Python Pillow/SVG.
- Configured dedicated authority palettes, crest emblem identifiers, and category badges for:
  - **OPSC** (Navy `#0A192F` + Brand Blue `#2563EB` + Gold)
  - **OSSC** (Dark Slate `#0F172A` + Cyan `#06B6D4`)
  - **OSSSC** (Deep Emerald `#061E14` + Teal `#14B8A6`)
  - **Odisha Police** (Crimson `#1E0808` + Ruby Red `#EF4444` + Gold)
  - **BSE Odisha** (Violet `#1E1B4B` + Purple `#8B5CF6` + Rose)
  - **Central Boards (SSC / UPSC / RRB / IBPS)** & **GENERAL_STRATEGY** (Indigo `#6366F1`)
- Connected into `automations/shared/pexels_image_fetcher.py` as the primary/fallback visual generator whenever stock photos lack high relevance.

### 3. Permanent 404 URL Resolution (`automations/shared/supabase_client.py`, `telegram.py`, `BlogPost.tsx`, `server.ts`)
- **Multi-Pass ID Extraction**: `insert_blog_post` parses both list and dict responses, and falls back to an immediate database query by title to guarantee the true PostgreSQL UUID is captured, completely eliminating `"generated-uuid"` fallbacks.
- **Telegram URL Resolver**: `resolve_clean_article_url` guarantees that all Telegram broadcasts and admin reports use verified live links.
- **Slug & Direct DB Fallback**: `BlogPost.tsx` and `server.ts` resolve articles by either UUID or normalized title slug.

### 4. Executive Blog Reader & Responsive Table Typography Engine (`src/index.css`, `src/pages/BlogPost.tsx`)
- **Automated Table Encapsulation**: Updated DOMParser in `BlogPost.tsx` to wrap every `<table>` inside `.oep-table-wrapper` (`overflow-x-auto rounded-[1.25rem] border border-slate-200 shadow-sm bg-white`) to eliminate mobile clipping.
- **Dark Gradient Header Styling**: Applied `#0F172A` → `#1E293B` gradient headers with uppercase bold white text and `16px 20px` cell padding.
- **Alternating Row Stripes & Hover Highlighting**: Even rows styled with `bg-slate-50/50` and hover highlights with `bg-brand-50/30`.
- **Prose Readability Upgrades**: Increased body text line-height to `1.85`, styled worked-example boxes with blue accent borders, and styled blockquote callouts with emerald/blue badges.

### 5. Imprinted UI Patterns & Progress Tracker Synchronized
- Registered Entries #52 (`ExecutiveBlogPostReader`) and #53 (`ExamBoardVectorBanner`) in `context/ui-registry.md`.
- Updated `context/progress-tracker.md` with completed milestones.

## Decisions made
- **Dual-Blog Separation**:
  - Blog 1 (`exam_update_engine.py` / `exam_update_cron.yml`): Strictly triggered by real official recruitment notices, dates, admit cards, and results.
  - Blog 2 (`seo_blog_engine.py` / `blog_cron.yml`): Deep, engaging educational masterclasses with zero speculative countdown claims.
- **Deterministic Visual Rendering**: Replaced generic stock photos with official 1200×630px vector card banners stored in `public/blog_covers/`.
- **Client-Side HTML Enhancement**: Uses DOMParser on `blog.description` to wrap tables, format headings, and attach scroll IDs on the fly.

## Problems solved
- **Speculative 60-Day Revision Plans for Unannounced Exams**: Completely disabled artificial countdown generation.
- **404 Broken Links (`/blog/generated-uuid`)**: Replaced placeholder fallbacks with verified database UUID retrieval.
- **Unprofessional / Cramped Tables & Dense Paragraphs**: Added responsive `.oep-table-wrapper`, alternating row stripes, dark gradient headers, and `1.85` line-height typography.
- **Mismatched Featured Images**: Integrated official exam board logo and vector graphics.

## Current state
- Full automated test suite and Python harnesses tested cleanly.
- `npm run build` succeeds with exit code 0.
- `context/ui-registry.md` and `context/progress-tracker.md` are up to date.

## Next session starts with
- Ready for any new feature request, frontend refinement, or automation directive.

## Open questions
- None.
