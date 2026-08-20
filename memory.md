# Memory — Site-Wide Odia (`ଓଡ଼ିଆ`) Localization & Default Language Architecture

Last updated: 2026-08-20T06:57:30+05:30

## What was built

### 1. Universal Phrase Engine & Odia Localization Layer
- **`src/lib/i18n/phraseDictionary.ts`**: Static dictionary containing 250+ system phrases with parameter interpolation and native Odia numeral conversions (`toOdiaDigits`).
- **`src/lib/LanguageContext.tsx`**: Context provider with fuzzy matching, dynamic event listeners (`oep-language-changed`), and local storage persistence (`oep-language-preference`).
- **`src/components/AutoTranslate.tsx`**: `<T>` component and `useAutoTranslate()` hook for effortless UI text internationalization.

### 2. Default Website Landing Language Set to Odia
- **`src/lib/LanguageContext.tsx`**: Updated `getStoredLanguage()` to default to `'or'` for any visitor without a pre-saved preference.
- **`index.html`**: Updated root tags to `<html lang="or" data-language="or">`. When new users arrive via Google Search or direct link, all system-generated UI elements render in Odia first by default.

### 3. Header Language Switcher Target Labeling
- **`src/components/LanguageToggle.tsx`**: Updated toggle logic so the button displays the language the user will **switch to**:
  - When viewing in **English** ➔ displays **`🌐 ଓଡ଼ିଆ`** (with tooltip *"Switch to Odia / ଓଡ଼ିଆ ଭାଷା କରନ୍ତୁ"*).
  - When viewing in **Odia** ➔ displays **`🌐 English`** (with tooltip *"Switch to English / ଇଂରାଜୀ ଭାଷା କରନ୍ତୁ"*).
  - Applied across desktop headers, signed-in utility pills, and mobile navigation drawers.

### 4. Comprehensive Study Plan & Leaderboard Localization
- **`ActiveExamContextBar.tsx`**: Context indicator translated (*"Target Exam Context"* ➔ `ଲକ୍ଷ୍ୟ ପରୀକ୍ଷା ପ୍ରସଙ୍ଗ`, *"All Exams Combined"* ➔ `ସମସ୍ତ ପରୀକ୍ଷା ସମ୍ମିଳିତ`).
- **`ExamContextSelectorModal.tsx`**: Full modal localized including search placeholders, category accordions, and active targets.
- **`AIStudyPlanCard.tsx`**: Study plan header, badges (*"Real Data Personalized"* ➔ `ବାସ୍ତବ ତଥ୍ୟ ଆଧାରିତ`), countdown timers, daily task progress, priority tags, dynamic task instructions, and action buttons.
- **`OdishaLeaderboardCard.tsx`**: Leaderboard headers, student rank (`ରେଙ୍କ୍ #୧୨,୯୨୫`), all 5 leagues (Bronze, Silver, Gold, Diamond, Master), XP requirements, filter tabs (*"Daily"*, *"Weekly"*, *"All-Time"*), sprint leader titles, and nearby rivals.
- **`SmartRecommendationCard.tsx`**: Weak topic focus area, weightage mark badges, accuracy percentiles, and 15-minute drill action triggers.
- **`TopicConfidenceMatrix.tsx`**: Status tags (*"Needs Practice"*, *"Strong Area"*, *"In Progress"*), question counters, and session metrics.
- **`PersonalBestCard.tsx`**: Milestone tiles (Best Score, Best Accuracy, Fastest Speed, Best Streak) and subject-wise score drawers.

### 5. Documentation & Registries
- **`context/ui-registry.md`**: Registered `LanguageToggle` (#64) and `DefaultOdiaLocalizationEngine` (#65).
- **`context/progress-tracker.md`**: Logged all completed localization and language default milestones.

## Decisions made

- **Target Labeling Pattern for Language Switcher**: The button displays the destination language rather than current language, eliminating user confusion.
- **Organic Traffic Odia First**: First-time visitors and Google search arrivals land on Odia by default, establishing authentic regional identity while preserving 1-click toggle to English.
- **Admin/Database Dynamic Content Immunity**: Questions, answers, explanations, and admin PDF titles remain untouched in their uploaded format, preventing translation distortion.

## Problems solved

- Resolved English fallback persisting across Study Plan cards and Leaderboard during language switches.
- Eliminated confusion in header globe toggle by showing target switch language.
- Configured default language boot sequence to eliminate language flash on initial load.

## Current state

- The whole website boots in Odia by default for first-time visitors and immediately updates all system-generated strings upon toggling.
- All Study Plan cards, Leaderboard, Recommendation Engine, Exam Context switcher, and Navigation docks are 100% localized.
- Production build passes cleanly with 0 TypeScript / Vite compilation errors (`npm run build` exited with code 0).

## Next session starts with

- Proceed with any new features, CBT exam updates, question bank additions, or analytics enhancements as requested by the user.

## Open questions

- None.
