# Memory — Whole-Exam Mock Test Series & Syllabus Parity Audit

Last updated: September 25, 2026, 11:28 IST

## What was built

1. **Stage 1 Structure Sizing Precision (`src/lib/serverAiGenerator.ts`)**:
   - Corrected `targetCount` fallback evaluation in `generateExamStructure` so that whole-exam test series properly generate 10 tests for `full-length` and `pyq` and 8 tests for `daily` (Weekly Benchmark) matching template patterns like `#[01-10]` and `#[01-08]`.
   - Verified Phase 1 generation:
     - `Full Mock Test #[01-10]`: 10/10 tests, 120m duration, 100 marks, comprehensive whole-syllabus scope.
     - `Official PYQ Paper #[01-10]`: 10/10 tests, 120m duration, 100 marks, authentic past paper simulation.
     - `Weekly Benchmark Test #[01-08]`: 8/8 tests, 60m duration, 50 marks, weekly assessment rhythm.

2. **Stage 2 Whole-Syllabus Equal Allocation & Authentic Grounding (`src/lib/serverAiGenerator.ts`)**:
   - Hardened `isGenericSetTitleWithoutPlaceholder` to catch `full\s*mock\s*test`, `official\s*pyq\s*paper`, and `weekly\s*(?:benchmark\s*)?test`.
   - Autonomously expands syllabus context up to 8,000 characters when no chapter placeholder exists.
   - Computes deterministic equal quotas across all constituent syllabus units (`Math.floor(totalQuestions / sectionCount)` + remainder distribution).
   - Injects authentic subject unit names into each question's `topic` field, completely eliminating generic `"General Syllabus"` tags.
   - Enforces paramount obedience to admin custom directives (`directivesMarkdown`) when specified.

3. **Automation QA Test Suites & Quality Gates**:
   - `scratch/test_mock_test_3_series.ts`: Live execution against Google Gemini across all 3 series -> **100% Pass** (Phase 1: 3/3 PASS, Phase 2: 3/3 PASS with exact 2 Qs / unit across History, Geography, Polity, Science).
   - `scratch/test_whole_syllabus_no_placeholder.ts`: 3/3 PASS.
   - `scratch/test_question_bank_4_categories.ts`: 4/4 PASS.
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: Code 0 (clean production build in 25.80s, server bundle 249.5 KB).

4. **UI Pattern Registry Imprinting (`context/ui-registry.md`)**:
   - Imprinted `SubcategoryCurriculumFilterBar` with dynamic section-aware presets, active pill states, and naming formula auto-sync.

## Decisions made

- **Autonomous Whole-Exam Series vs Chapter-Locked Mode**: When a title lacks a specific chapter placeholder (e.g. `Full Mock Test #[01-10]`, `Official PYQ Paper #[01-10]`, `Weekly Benchmark Test #[01-08]`), the engine treats the title as a whole-syllabus examination rather than failing or restricting to a single chapter.
- **Strict Multi-Unit Quota Balancing**: Autonomous whole-syllabus generation deterministically divides the requested question count equally across all constituent units.
- **Authentic Subject Metadata**: Questions in full-length tests must always retain their specific constituent unit/subject in the `topic` field rather than generic labels.

## Problems solved

- Resolved bug where `targetCount` in Stage 1 was prematurely defaulting to 6 tests when `req.count` was omitted, truncating 10-test series to 6.
- Hardened regex token matching for `Weekly Benchmark Test` where the word "Benchmark" sat between "Weekly" and "Test".
- Resolved generic topic metadata leakage by mapping each generated question index directly to its allocated syllabus section.

## Current state

- All 3 whole-exam Mock Test Series scenarios work with 100% precision.
- Flashcard Natural Density, Question Bank (4 Categories), Practice Tests, and Mock Tests are in full production parity.
- TypeScript compiler and production Vite + ESBuild bundles compile cleanly with 0 errors.

## Next session starts with

- Awaiting user's next priority or feature request from `context/build-plan.md`.

## Open questions

- None. All requirements and test scenarios are fully met and verified.


