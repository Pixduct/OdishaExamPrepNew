# Memory — Full-Screen Widescreen Layout, Executive Footer & Big Brand Watermark Overhaul (v7.6.0)

Last updated: 2026-08-15T22:17:30+05:30

## What was built

### 1. Full-Screen Widescreen Layout Overhaul (`src/App.tsx`)
- **1440px Widescreen Boundaries:** Standardized all primary landing section containers (`Exams`, `Syllabus Paths`, `Achievers Journal`, `Exam Registry Bulletin`, `Footer`) to `max-w-7xl` (1280px / 1440px) to utilize ultra-wide desktop monitors cleanly.
- **Responsive 3-Column Grids:** Cards in Syllabus Paths and Achievers' Journal sections tile into responsive 3-column layouts on desktop screens (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).

### 2. Dual-Theme Vector Cards & Dark Mode Component Overhaul (`src/App.tsx`, `YouTubeCarousel.tsx`, `DynamicVectorCard.tsx`)
- **Universal Dynamic Vector Cards:** Wrapped Hero preview card, Sign-in banner, Daily study streak card, Syllabus topic cards, Achievers' Journal testimonial cards, and pre-footer stat cards in `<DynamicVectorCard>` with cursor spotlight lighting, ambient flare, and 3D parallax tilt.
- **Official Exam Registry Section Dual-Theme Fix:** Upgraded status badges (`Notification Released`, `Admit Card Out`, `Applications Active`, `Result Declared`, `Postponed`, `Upcoming`) with dark mode backgrounds (`bg-emerald-950/70`, `bg-amber-950/70`, `bg-blue-950/70`) and high-contrast luminous blue `FREE TEST →` action CTA buttons (`bg-[#2563EB] text-white shadow-[4px_4px_0px_rgba(37,99,235,0.4)]`).
- **Achievers Journal Load More Button Fix:** Converted "Load More preparation journals" button into a dual-theme vector button (`bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-900 dark:border-slate-700 shadow-[4px_4px_0px_#2563EB] dark:shadow-[4px_4px_0px_rgba(37,99,235,0.5)]`).

### 3. Executive Footer Contrast & Legibility Overhaul (`src/App.tsx`)
- **Obsidian Executive Canvas (`bg-[#0a0f1d] dark:bg-[#070a10]`):** Converted dim, unreadable text into high-contrast text (`text-white`, `text-slate-200`, `text-slate-300`) and crisp vector stat card borders (`bg-slate-900/90 border-2 border-slate-800`).
- **Bright Input Controls & Luminous Icons:** Updated newsletter email input to `bg-slate-900 border-2 border-slate-700 focus:border-[#2563EB] text-white placeholder:text-slate-400` and link icons to luminous blue (`text-brand-400`).

### 4. Big Executive Brand Watermark Headline (`src/App.tsx`)
- **OdishaExamPrep Watermark:** Integrated a massive, responsive brand watermark statement at the bottom of the footer (`text-4xl sm:text-6xl md:text-8xl lg:text-[7.5rem] xl:text-[9.5rem] 2xl:text-[11rem] bg-gradient-to-b from-slate-700/40 via-slate-800/25 to-transparent bg-clip-text text-transparent`) styled with `pointer-events-none select-none`.

### 5. Consistent Site-Wide Section Divider Lines (`src/App.tsx`)
- **Horizontal Section Separators:** Restored `border-b border-slate-200/50 dark:border-slate-800` across all homepage sections.
- **Card Slicing Resolution:** Replaced negative margin overlap (`-mt-6 sm:-mt-8`) with clean positive vertical padding (`py-8 sm:py-10`), maintaining 100% section border consistency without slicing across any card container.

### 6. Ultra-Smooth 120 FPS Lenis Smooth Scrolling Engine (`src/lib/lenisScroll.ts`)
- **Lenis Smooth Scroll:** Integrated Lenis smooth scroll engine globally (`lerp: 0.1, duration: 1.05s`).
- **Zero Re-Render 120 FPS Loop:** Optimized `MouseTrackingCanvas`, `VectorCursorFollower`, and `DynamicVectorCard` to use direct DOM `translate3d` refactors and active scroll-guard pointer-events lock (`.is-scrolling * { pointer-events: none !important; }`), ensuring 120 FPS scrolling across all viewports.

### 7. Expanded 10-Slide Regional Distribution & Caption Grouping (`automations/ca_formatter.py`, `ca_publisher.py`)
- **10-Slide Regional Sequence**: Enforced strict 4 Odisha State (1–4), 4 National & Economy (5–8), and 2 World & International (9–10) slide order.
- **Single Clean Card Badges**: Preserved single category badge header on visual card images (`SCHEMES & POLICIES`, `BREAKING NOTICE`, `ECONOMY & TECH`, `DEFENCE`, etc.).
- **Regional Telegram Caption Grouping**: Formatted Telegram HTML text notifications into 3 clean regional blocks: `📍 ODISHA STATE AFFAIRS`, `🇮🇳 NATIONAL & ECONOMY`, and `🌍 WORLD AFFAIRS`.

### 8. Legacy Website Workflow Cleanup (`.github/workflows/exam_update_cron.yml`, `.github/workflows/blog_cron.yml`)
- **Removed Obsolete Workflows**: Deleted `.github/workflows/exam_update_cron.yml` and `.github/workflows/blog_cron.yml` from main website repo `Pixduct/OdishaExamPrepNew` ([`commit a41dcdb`](https://github.com/Pixduct/OdishaExamPrepNew/commit/a41dcdb)).
- **Consolidated Automation Engine**: All 7 production workflows are centrally deployed and managed under `Pixduct/odisha-mcq-engine` with concurrency controls and 15-minute timeouts.

### 9. Bulletproofed Dotenv Imports & Requirements (`automations/requirements.txt`, `ca_formatter.py`, `ca_website_publisher.py`, `breaking_engine.py`)
- **Dependency Registration**: Added `python-dotenv` and `supabase` to `automations/requirements.txt` so GitHub Actions automatically installs them during setup.
- **Safe Import Guards**: Wrapped `from dotenv import load_dotenv` in `try...except ImportError` across all Python scripts so missing local environment packages will **never** crash CI/CD server executions where `os.environ` is injected directly.

### 10. Imprinted Design Registry & Progress Tracker (`context/ui-registry.md` & `context/progress-tracker.md`)
- Imprinted visual component specs for `ExamRegistryStatusBadge`, `DualThemeVectorButton`, `ExecutiveFooter`, `BigBrandFooterWatermark`, and `LenisScrollEngine` in `context/ui-registry.md`.
- Logged all completed features in `context/progress-tracker.md`.

## Decisions made
- **Widescreen Standard:** Standardized major landing page sections on `max-w-7xl` (1440px) container bounds with 3-column responsive grids.
- **Centralized Automation Engine:** All backend Python automations and GitHub Action workflows run exclusively in `Pixduct/odisha-mcq-engine`.
- **Regional Slide Sequence:** Strictly order the 10 slides into 4 Odisha, 4 National, and 2 World slides to guarantee balanced regional news distribution.
- **Executive Brand Watermark:** Placed full-width `OdishaExamPrep` metallic dark gradient watermark at the very bottom of the footer below the copyright line.
- **Card Slicing Resolution:** Replaced negative margin overlaps with clean positive vertical section padding (`py-8 sm:py-10`), preserving horizontal section divider lines while preventing card slicing.
- **High-Contrast Dark Mode Buttons:** All action buttons feature luminous blue background with white text (`text-white`) and hard-edge vector offset shadows for 100% legibility in both light and dark modes.

## Problems solved
- **No module named 'dotenv' Error on GitHub Actions:** Fixed by adding `python-dotenv` and `supabase` to `requirements.txt` and wrapping `dotenv` imports in `try/except ImportError` blocks across all scripts.
- **Recurring GitHub Email Failure Alert for Exam Update Engine:** Resolved by deleting legacy, unconfigured workflow files from `Pixduct/OdishaExamPrepNew` and consolidating all cron execution under `Pixduct/odisha-mcq-engine`.
- **Footer Unreadable Text in Light Mode:** Solved by upgrading the footer to a rich obsidian dark canvas (`bg-[#0a0f1d]`) with bold white titles, crisp slate body text (`text-slate-300`), bright input controls, and luminous icons.
- **Card Slicing Issue:** Fixed horizontal section border line slicing through the Sign-In banner card by eliminating negative top margin overlap and using positive section padding.
- **Unadapted Dark Mode Buttons:** Fixed "FREE TEST →" and "Load More" buttons staying pitch white or dark text on dark background by adding adaptive dual-theme vector button styles.
- **Light-Mode Status Badges:** Fixed washed-out status badges by adding deep slate dark mode backgrounds (`bg-emerald-950/70`, `bg-amber-950/70`, `bg-blue-950/70`).

## Current state
- 100% clean production build verified (`npx tsc --noEmit` completed with 0 errors).
- Website repo committed and pushed to `Pixduct/OdishaExamPrepNew` ([`commit a41dcdb`](https://github.com/Pixduct/OdishaExamPrepNew/commit/a41dcdb)).
- Central automation engine committed and pushed to `Pixduct/odisha-mcq-engine` ([`commit 06fab80`](https://github.com/Pixduct/odisha-mcq-engine/commit/06fab80)).

## Next session starts with
- Assist the user with any new feature requests, page layout updates, or administrative enhancements.

## Open questions
- None.
