# Memory — Comprehensive Odisha & Central Exam Coverage & Real-Time Notification Pipeline

Last updated: September 25, 2026, 14:45 IST

## What was built

1. **Comprehensive 54-Authority Portal & Whitelist Alignment**:
   - `exam_registry.json`: Synchronized 54 nodal authorities (20 Odisha State boards + 34 Central Government entities) covering small to mega exams.
   - `automations/config/trusted_sources.json`: Added 18 missing official domains (DSE Odisha, India Post, KVS, NVS, EMRS, Army, Navy, Air Force, Coast Guard, CTET, CSIR, NIELIT, DTET, OSCSC, CHSE).
   - `automations/shared/source_validator.py`: Upgraded `SourceValidator.is_official_domain` to recognize sovereign Indian government suffixes (`.gov.in`, `.nic.in`, `.res.in`), preventing legitimate sub-district/board notices from being dropped.
   - `automations/exam_update_engine.py`: Verified `DIRECT_PORTAL_MAP` covers 100% (54/54) of registered recruitment portals with zero unmapped boards.

2. **Universal 54-Board Acronym Extraction & Word Boundary Clamping (`automations/breaking_engine.py`)**:
   - Expanded `extract_board_info` from an incomplete 19-board hardcoded list to cover all 54 nodal authorities with correct short acronyms and official domains.
   - Enforced regex word boundaries (`\b`) on short acronyms (`\blic\b`, `\bfci\b`, `\baai\b`, `\brbi\b`, `\bsbi\b`, `\bssc\b`, etc.), eliminating false-positive matches (e.g. `applications` previously matching `lic`).

3. **20-Category Classification Precision & Prioritization (`automations/breaking_engine.py`)**:
   - Prioritized high-urgency windows in classification logic: Objection Window before Answer Key, Final Answer Key before Provisional, Exam City Intimation slip before Exam Date, Corrigendum before Advt, and Advt Release before Application Start.
   - Expanded regex tokens for Exam City Intimation (`examination city`, `city allotment`, `intimation slip`).

4. **1080x1080 Visual Alert Card Engine (`automations/exam_card_renderer.py`, `automations/templates/template_alert.html`)**:
   - Upgraded top-bar to a 3-column CSS Grid (`grid-template-columns: auto 1fr auto;`) with board tag clamping ($\le 22$ chars) to eliminate badge collision with category badges.
   - Replaced plain bullet lists with self-distributing Glass Highlight Cards (`flex: 1; justify-content: space-evenly;`) to eliminate vertical voids.
   - Scaled typography for mobile legibility (34px–42px headlines, 21px–22px body, 30px stat icons).

5. **Automated Senior QA Test Suite & Quality Verification (`scratch/senior_qa_exam_notification_audit.py`)**:
   - Module 1 (Authority & Portal Coverage): 5/5 PASSED.
   - Module 2 (20-Category Universal Classification): 21/21 PASSED.
   - Module 3 (Anti-Noise & Anti-Hallucination Guardrails): 8/8 PASSED (Tenders, DPC promotions, deputations, and expired dates deterministically rejected; genuine vacancies preserved, hallucinated counts sanitized).
   - Module 4 (End-to-End Scenarios & Playwright Card Rendering): 16/16 PASSED (District Courts, ISRO IPRC, Odisha Fire Service, SSC CGL).
   - Total Suite: **50/50 Tests Passed (100.0%)** in 9.42s.
   - TypeScript compilation (`npx tsc --noEmit`): 0 errors.

6. **Documentation & Registry Imprints**:
   - Updated `context/progress-tracker.md` with complete audit details.
   - Imprinted `ExamNotificationVisualCardAndTopBar` in `context/ui-registry.md`.

## Decisions made

- **Sovereign Indian Government TLD Recognition**: Recognizing `.gov.in`, `.nic.in`, and `.res.in` in `SourceValidator` guarantees future district courts, municipal bodies, or newly created board websites are never rejected, while maintaining strict defense against third-party aggregators.
- **Strict Word-Boundary Token Matching**: Short acronyms (2–3 characters) must always use `\b` regex boundaries to avoid inadvertent substring matches in general prose.
- **Classification Specificity Hierarchy**: Specific lifecycle phases (Objection Window, Corrigendum, City Intimation) take precedence over generic parent phases (Answer Key, Exam Date, Application Notice).
- **Anti-Hallucination Vacancy Grounding**: If AI outputs a vacancy number not present in raw official source text, it is deterministically stripped and replaced with `"Refer to Official Notification PDF"`.

## Problems solved

- Fixed 18 missing official domains in `trusted_sources.json`.
- Fixed defect where 35/54 authorities fell back to generic "RECRUITMENT BOARD" in breaking alert cards.
- Fixed top-bar collision defect where long board names occluded category pills.
- Eliminated dead empty voids in 1080x1080 cards via adaptive glassmorphic highlight cards.

## Current state

- All 54 recruitment boards (Odisha & Central) are 100% covered and mapped.
- Real-time notification ingestion, classification, anti-hallucination sanitization, card rendering, and Telegram caption generation pass all 50 automated tests.
- Codebase is clean, TypeScript compiles with 0 errors.

## Next session starts with

- Confirm with user the next feature priority from `context/build-plan.md` or next operational workflow to execute.

## Open questions

- None. All 50 QA assertions and rendering stress scenarios are 100% verified and green.
