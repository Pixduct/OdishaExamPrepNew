# Memory — Current Affairs Paper Setter's Lens, 5-Layer Deterministic Safety Architecture & Admin Audit

Last updated: August 21, 2026

## What was built

### 1. The Paper Setter's Lens & 7 Core Syllabus Domains (`ca_formatter.py`, `ca_website_publisher.py`)
- **Exam Question Probability Test**: Trained the AI system prompts to act as a Senior Paper Setter (UPSC, OPSC, OSSC, SSC CGL, Banking), evaluating every raw news item and only approving stories with an exam relevance score of **8/10 or higher**.
- **7 Core Syllabus Domains**: All published news is mapped strictly to:
  1. *Governance, Law & Polity* (Bills, Acts, Amendments, SC/HC Verdicts, CAG, ECI)
  2. *Economy, Banking & Infrastructure* (RBI, GST, Budgets, Foreign Trade, Ports/Expressways)
  3. *Science, Space & Technology* (ISRO, DRDO, Nuclear Energy, AI Missions)
  4. *Environment, Ecology & Geography* (Ramsar Sites, Tiger Reserves, IUCN Status, Climate)
  5. *International Relations & Defense* (Bilateral Exercises, Multilateral Summits: G20/BRICS/SCO)
  6. *Odisha State Governance & Regional GK* (Odisha Cabinet Approvals, State Schemes, Heritage)
  7. *National Honours, Records & Top Appointments* (Padma/Khel Ratna Awards, CJI/ECI Chiefs)

### 2. Geographic Directional Fragment Rejection & Routine Accident Noise Filters (`ca_formatter.py`)
- **Ban on Directional Fragments**: Strictly prohibited lazy directional adjectives like *"in North"*, *"in South"*, *"in East"*, *"in West"*, *"in Central"* without naming the specific River, Sea, District/Province, and State/Country.
- **Accident & Noise Filters**: Added regex filters (`boat capsizes`, `capsizing`, `ferry sinks`, `drowned`, `bus crash`, `campus protest`) to drop low-yield routine tragedies automatically.

### 3. 5-Layer Deterministic Python Safety Net (Intercepting "Dumb" AI Drift)
- **Layer 1: Pre-AI Scraper Sanitization** — Drops unverified dates and crime/accidents before the LLM sees the text.
- **Layer 2: AI Generation** — Paper Setter prompt with 5W1H entity constraints.
- **Layer 3: Deterministic Python Quality Gates (`validate_slide_quality`)** — Hard Python code tests numeric fact claims, date validity against raw news, directional fragments, ghost actors, and bullet counts. Drops any non-compliant slide immediately.
- **Layer 4: Minimum Viable Quality Quorum (`MIN_SLIDES_TO_POST = 5`)** — Cancels the public broadcast entirely if fewer than 5 clean slides survive the Python bouncer, notifying Admin Telegram DM.
- **Layer 5: Slide-by-Slide Telegram Admin Audit** — Delivers an item-by-item verification proof for every published slide directly to Admin DM (`1317595163`).

---

## Decisions made
- **Deterministic Code over Probabilistic AI**: Never rely on prompt constraints alone; use strict Python regex and fact-check bouncers as the ultimate gatekeeper.
- **Fail-Safe Quorum**: Aborting public broadcasts rather than publishing low-quality or hallucinated news if the AI has an off day.
- **Syllabus Relevance over Sensationalism**: Prioritize policy milestones and constitutional developments over emotional accident stories.

---

## Problems solved
- **Vague Directional Headlines**: Eliminated cards like *"Dozens Dead after Boat Capsizes in North"* by banning directional fragments and filtering routine boat accidents.
- **AI Boundary Drift**: Hardened post-AI Python validators so invalid dates, fake numbers, or missing states get dropped automatically.
- **Outdated / Archive News**: Enforced strict 24-hour timestamp verification in the scraper.

---

## Current state
- Frontend builds with **0 errors** (`npm run build` exit code `0`).
- Automations submodule (`Pixduct/odisha-mcq-engine`) and parent repository (`Pixduct/OdishaExamPrepNew`) are fully synced and pushed to GitHub `main`.
- `context/progress-tracker.md` is 100% updated.

---

## Next session starts with
- Ready for any new feature requests, study tools, UI enhancements, or automation workflows.

---

## Open questions
- None. All tasks and quality safeguards are verified and active.

---

## Next session starts with
- Ready for any new feature requests, content additions, or student-facing enhancements.

---

## Open questions
- None. All requested decoupling features and safeguards are fully implemented and verified.

