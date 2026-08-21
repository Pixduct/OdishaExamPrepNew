# Memory — Current Affairs Cognitive AI Training, Geographic Resolution, Date Gate & Slide-by-Slide Admin Verification

Last updated: August 21, 2026

## What was built

### 1. Mandatory Geographic State & Country Resolution Engine (`automations/ca_formatter.py`, `automations/ca_website_publisher.py`)
- **Indian State Resolution**: Enforced that whenever an Indian district, city, port, or town is mentioned in national news (e.g. *Nellore*, *Dharwad*, *Indore*, *Wayanad*), the AI must actively resolve and state its parent State (e.g., `Nellore District (Andhra Pradesh)`, `Dharwad District (Karnataka)`).
- **Odisha Scope**: Mandated `District & Block/Tehsil` formatting without redundant "Odisha, India" suffixes.
- **Global Scope**: Mandated `City/Region (Country)` formatting (e.g. `Bavaria (Germany)`).
- **Unique Bullet Headings**: Prohibited bullet headings from repeating card headlines, enforcing distinct 2–4 word topic tags.

### 2. Cognitive Acronym Reasoning & Campus Dispute Rejection Engine (`automations/`)
- **Student Syllabus & Recognition Test**: Replaced rigid acronym restrictions with cognitive syllabus reasoning. Freely allows standard, syllabus-studied exam bodies and statutory institutions (`ISRO`, `DRDO`, `RBI`, `SEBI`, `NABARD`, `NITI Aayog`, `UPSC`, `OPSC`, `IMF`, `NATO`, `ASEAN`, `NCERT`, `ICAR`, `AIIMS`, `CSIR`, `BARC`, `GST`, `SC`, `HC`, `WHO`, `UN`) while strictly forbidding obscure local community unions or niche regional acronyms (like `KPMS`, `KSU`, `DKS`) in headlines.
- **Campus Dispute Rejection**: Automatically rejects local university protests, college strikes, student-teacher allegations, and regional community petitions.

### 3. Universal Concrete Entity & Zero Ghost Actors Principle (`automations/`)
- **Zero Ghost Actors**: Strictly eliminated vague ghost actors like *"the government has been under pressure"* or *"according to recent reports"*.
- **Mandatory Entity Naming**: Enforced naming concrete Authorities, Ministries, Boards, Courts, Scheme/Yojana names, and specific beneficiary groups across all news topics (Space, Defense, Economy, Education, Environment, Law, Agriculture).

### 4. Strict Same-Day Verified Date Gate (`automations/ca_scraper.py`, `automations/ca_formatter.py`)
- **Scraper Hard 24h Gate**: Eliminated `UNVERIFIED` date fallbacks in `ca_scraper.py`. Strictly discards any RSS item without a verified timestamp within the last 24 hours. Tested and verified 100% same-day timestamps (263 fresh items).
- **Critical Date-Match Rule**: Instructs AI to only select and format news whose event date is verified as Today or Yesterday, automatically skipping ambiguous or outdated retrospective statements.

### 5. Slide-by-Slide Verification & Audit Report for Admin Telegram Bot (`automations/ca_publisher.py`)
- **Item-by-Item Verification**: Upgraded `ca_publisher.py` to send a detailed slide-by-slide verification report to Admin Telegram Bot DM (`1317595163`), displaying region, category, headline, 24h date match proof, lead point, and quality check status for every visual card.
- **Rejection Audit**: Exposed `_dropped_quality` in `ca_formatter.py` to report gatekeeper rejection details.
- **Message Chunking Safeguard**: Added automatic message splitting in `send_telegram_admin_status` for reports exceeding 4,000 characters.

---

## Decisions made
- **Cognitive Syllabus Reasoning over Static Acronym Lists**: Instead of a hardcoded list of 10 acronyms, the AI uses reader empathy to allow all official syllabus bodies while banning obscure local shortcuts.
- **Universal Entity Principle over Category Silos**: Applied a single universal "No Ghost Actors" rule across all news varieties instead of creating narrow category silos.
- **Zero Tolerance for Unverified Dates**: Dropped unverified fallback items from the scraper entirely to prevent old archives from ever reaching the AI news pool.

---

## Problems solved
- **Missing State Names**: Fixed cards like *Nellore Modernising Parks* where the parent state (*Andhra Pradesh*) was previously omitted.
- **Unknown Shortcuts in Headlines**: Prevented obscure acronyms like *KPMS* from confusing students.
- **Vague Fluff Cards**: Eliminated cards like *20 Lakh Students Awaiting Fee Reimbursement* that lacked state/scheme names.
- **Outdated / Deceased Leader News**: Prevented past retrospective statements (e.g. Gen Bipin Rawat quotes) from being published under today's date.
- **Lack of Admin Visibility**: Transformed admin execution reporting into an exhaustive slide-by-slide verification audit.

---

## Current state
- 100% of automation code and documentation synced and pushed to GitHub `main` across `Pixduct/odisha-mcq-engine` and `Pixduct/OdishaExamPrepNew`.
- `context/progress-tracker.md` is fully updated.
- Frontend builds cleanly with **0 TypeScript errors** (`npm run build` exit code 0).

---

## Next session starts with
- Ready for any new feature requests, exam study modules, or design system enhancements.

---

## Open questions
- None. All mobile optimizations have been built, verified, and imprinted.
