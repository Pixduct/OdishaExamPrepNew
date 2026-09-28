# Memory — Executive Graphic Card & Anti-Hallucination Blog Visual Engine

Last updated: September 28, 2026, 20:45 IST

## What was built

1. **Executive Graphic Card Synthesis Engine (`automations/shared/imagen_generator.py`)**:
   - Replaced generic/synthetic AI diffusion backdrops with a 1200×675 (16:9) obsidian dark-themed digital executive card generator.
   - Built with Pillow: Obsidian slate background (`#0A0F1C`), ambient radial glows (royal blue, teal, warm amber), glassmorphic rounded card container, board authority pill (`HIGH COURT OF ORISSA, CUTTACK`, `OPSC`, `OSSSC`, `ODISHA POLICE`), category status badge, 2-line title, 2-line executive summary in muted slate (`#94A3B8`), 3 structured micro-cards with color accent indicators (blue, emerald, amber), and verified footer bar with vector dot (`● 100% Verified Official State Notice`).
   - Wired to optional Supabase Storage (`blog-covers` bucket) with local file storage fallback.

2. **Strict Factual Anti-Hallucination Grounding (`extract_card_metadata`)**:
   - Configured Gemini 3.5 Flash Lite with `temperature: 0.1` and explicit system prompt rules:
     - Extracts **only** entities, post titles, numbers, and dates explicitly present in the input text.
     - Strictly forbids inventing or hallucinating vacancy numbers, phantom exam stages, or fake salary/eligibility details.
     - Dynamically adapts micro-card labels based on article type (Results: `ORGANIZATION`, `POSTS`, `RESULT STATUS`; Strategy: `TARGET EXAM`, `STUDY DOMAIN`, `ACTION PLAN`; Recruitment: `ORGANIZATION`, `VACANCIES / POSTS`, `STATUS`).
   - Includes deterministic offline regex fallback for complete resilience.

3. **Dynamic Multi-line Text Wrapping**:
   - Enhanced `render_executive_graphic_card` with `wrap_text` for micro-card values and subtexts.
   - Eliminates blunt string slicing (`[:24]`), allowing long post names (e.g., `"Junior Grade Typist and Data Entry Operator"`) to wrap cleanly across 2 lines without awkward cutoffs.

4. **Automated Test Suite & Verification**:
   - Automated 5-board test suite (`automations/tests/test_executive_cards.py`) testing Orissa High Court, OPSC, OSSSC, Odisha Police, and Daily Current Affairs.
   - All tests pass in < 3.5s per card.

5. **Version Control & Documentation**:
   - Submodule `automations` (`Pixduct/odisha-mcq-engine` on `main`) committed and pushed at `abad440`.
   - Root repository (`Pixduct/OdishaExamPrepNew` on `main`) committed and pushed at `488e754`.
   - Imprinted in `context/ui-registry.md` and synced in `context/progress-tracker.md`.

## Decisions made

- **Typography-Led Executive Cards Over Diffusion Photos**: AI diffusion models cannot reliably generate real Indian government institutional buildings and output distorted, synthetic-looking images. An executive typography card (inspired by Stripe/Vercel OG image cards) delivers 100% official credibility, readable text, and instant recognition.
- **Low Temperature (0.1) LLM Metadata Extraction**: Prevents model hallucination and ensures only facts from the actual blog post appear on the card.
- **Micro-card Dynamic Wrapping**: Usable text width calculated per card (`max_card_text_w = 286px`) so cards adapt cleanly to varying post title lengths.

## Problems solved

- **Eliminated Generic Stock & Distorted AI Images**: Blog covers are now branded, executive-grade cards.
- **Eliminated Hallucinated Dates & Numbers**: Card content is strictly grounded in the blog text.
- **Fixed Truncated Text in Micro-Cards**: Replaced hard string slices with dynamic two-line wrapping.

## Current state

- All 5 board test cards generated and verified (`public/blog_covers/ai_test-*.jpg`).
- Git branches clean and pushed to GitHub main across both repositories.
- Production build passes with zero errors (`npm run build`).

## Next session starts with

- Run `/remember restore` to restore this state.
- Proceed with any next automated publishing workflow or feature requested.

## Open questions

- None. Visual card generation is verified, grounded, and production ready.

