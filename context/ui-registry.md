# UI Registry — OdishaExamPrep

This document is the living component registry for **OdishaExamPrep** (`https://www.odishaexamprep.in`). It catalogues every reusable UI component in the codebase.

Before creating any new component, developers and AI agents MUST consult this registry to reuse or extend existing components.

---

## How to Use

1. **Search First:** Before creating a UI component, search this registry.
2. **Reuse Before Creating:** If an existing component satisfies the requirement, use it.
3. **Extend Don't Duplicate:** If an existing component requires minor additions, add optional props to extend it.
4. **Register Immediately:** When a new reusable component is added or modified, update this registry.

---

## Component Index

| Component Name | Category | File Path | Variants | Used By | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`PageLayout`** | Layout | [`src/components/PageLayout.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/PageLayout.tsx) | Default, Full Width | All Page Views | Active |
| **`Button`** | Utility | [`src/components/Button.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/Button.tsx) | Primary, Secondary, Glass | App.tsx, AdminPanel.tsx | Active |
| **`MathTextRenderer`** | Data Display | [`src/components/MathTextRenderer.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/MathTextRenderer.tsx) | Inline, Block Math | MockTestSystem, BlogPost | Active |
| **`UniversalMathDiagramEngine`**| Data Display | [`src/components/UniversalMathDiagramEngine.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/UniversalMathDiagramEngine.tsx) | Canvas, Vector SVG | MockTestSystem, AdminPanel | Active |
| **`DiagramTemplateSelector`** | Form Control | [`src/components/DiagramTemplateSelector.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/DiagramTemplateSelector.tsx) | Modal Grid | AdminPanel.tsx | Active |
| **`StickyAICompanion`** | AI Assistant | [`src/components/StickyAICompanion.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/StickyAICompanion.tsx) | Drawer, Floating FAB | MockTestSystem, App.tsx | Active |
| **`OnboardingTour`** | Feedback / Tour | [`src/components/OnboardingTour.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/OnboardingTour.tsx) | Desktop Popover, Mobile Action Sheet | App.tsx | Active |
| **`PushPermissionPrompt`** | Feedback | [`src/components/PushPermissionPrompt.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/PushPermissionPrompt.tsx) | Top Banner | App.tsx | Active |
| **`ChangeImpactModal`** | Modal | [`src/components/ChangeImpactModal.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/ChangeImpactModal.tsx) | Warning Overlay | AdminPanel.tsx | Active |
| **`SearchableSelect`** | Form Control | [`src/components/SearchableSelect.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/SearchableSelect.tsx) | Filterable Dropdown | AdminPanel.tsx | Active |
| **`TimePicker`** | Form Control | [`src/components/TimePicker.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/TimePicker.tsx) | Time Input | AdminPanel.tsx | Active |
| **`YouTubeCarousel`** | Media | [`src/components/YouTubeCarousel.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/YouTubeCarousel.tsx) | Video Carousel | App.tsx | Active |
| **`LoadingPortal`** | Feedback | [`src/components/LoadingPortal.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/LoadingPortal.tsx) | Full Screen Spinner | App.tsx | Active |
| **`WelcomeVideoModal`** | Media / Modal | [`src/components/WelcomeVideoModal.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/WelcomeVideoModal.tsx) | YouTube Embed Modal | App.tsx | Active |
| **`AnimatedRoutes`** | Navigation | [`src/components/AnimatedRoutes.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/AnimatedRoutes.tsx) | Motion Fade Transition | App.tsx | Active |
| **`ProtectedRoute`** | Guard | [`src/components/ProtectedRoute.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/ProtectedRoute.tsx) | Auth Route Guard | App.tsx | Active |
| **`VoiceWaveVisualizer`** | Feedback | [`src/components/VoiceWaveVisualizer.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/VoiceWaveVisualizer.tsx) | Equalizer waveform animation | AiMentor.tsx, StickyAICompanion.tsx | Active |
| **`QuestionBankCard`** | Data Display | [`src/App.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/App.tsx#L6885-L7080) | Grid Card, Mobile List Item | App.tsx | Active |
| **`ScheduledPracticeBankCard`** | Data Display | [`src/App.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/App.tsx#L3073-L3285) | Desktop Grid, Mobile List Item | App.tsx | Active |
| **`NotificationCenter`** | Navigation / Overlay | [`src/components/NotificationCenter.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/NotificationCenter.tsx) | Bell Trigger + Floating Popover | App.tsx (Header) | Active |
| **`GlobalSearchModal`** | Navigation / Overlay | [`src/components/GlobalSearchModal.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/GlobalSearchModal.tsx) | Spotlight Search Portal (Full-screen portal) | App.tsx (Header) | Active |
| **`AdminSortDirectionToggle`** | Admin / Toolbar | [`src/AdminPanel.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/AdminPanel.tsx) | Asc/Desc pill toggle in Content Banks sub-header | AdminPanel.tsx | Active |
| **`InlineOrderInput`** | Admin / Table Row | [`src/AdminPanel.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/AdminPanel.tsx) | Editable numeric ORDER field in table rows | AdminPanel.tsx | Active |
| **`CategoryHierarchyPillBar`** | Admin / Toolbar | [`src/AdminPanel.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/AdminPanel.tsx) | Hierarchy pill toolbar with auto tab switcher | AdminPanel.tsx | Active |

---

## Component Details

### 1. `PageLayout`
- **File Path:** [`src/components/PageLayout.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/PageLayout.tsx)
- **Category:** Layout
- **Purpose:** Standard top-level container for all public pages, rendering the main header navigation, drawer menu, content container, and footer.
- **Props:** `children` (`ReactNode`, required), `className` (`string`, optional).
- **Styling:** `min-h-screen flex flex-col bg-[#FBF9F6]`.

```tsx
import { PageLayout } from '../components/PageLayout';

export function CustomPage() {
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1>Page Content</h1>
      </div>
    </PageLayout>
  );
}
```

---

### 2. `MathTextRenderer`
- **File Path:** [`src/components/MathTextRenderer.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/MathTextRenderer.tsx)
- **Category:** Data Display
- **Purpose:** Parses raw text strings containing inline (`$...$`) or block (`$$...$$`) LaTeX equations, renders them using KaTeX, and sanitizes the output with DOMPurify.
- **Props:** `text` (`string`, required), `className` (`string`, optional).
- **Dependencies:** `katex`, `dompurify`.

```tsx
import { MathTextRenderer } from '../components/MathTextRenderer';

<MathTextRenderer 
  text="Solve for x: $x^2 + 5x + 6 = 0$" 
  className="text-slate-800 text-base font-medium" 
/>
```

---

### 3. `UniversalMathDiagramEngine`
- **File Path:** [`src/components/UniversalMathDiagramEngine.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/UniversalMathDiagramEngine.tsx)
- **Category:** Data Display
- **Purpose:** Renders dynamic vector SVG and Canvas geometric figures (triangles, circles, polygons, coordinate axes, Venn diagrams, circuits) based on structured JSON props.
- **Props:** `diagram` (`DiagramSpec`, required), `className` (`string`, optional).
- **Dependencies:** KaTeX, React Hooks.

```tsx
import { UniversalMathDiagramEngine } from '../components/UniversalMathDiagramEngine';

<UniversalMathDiagramEngine 
  diagram={{
    type: 'triangle',
    labels: { A: '(0,0)', B: '(4,0)', C: '(2,3)' },
    angles: { A: '60°', B: '60°', C: '60°' }
  }} 
/>
```

---

### 4. `StickyAICompanion`
- **File Path:** [`src/components/StickyAICompanion.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/StickyAICompanion.tsx)
- **Category:** AI Assistant
- **Purpose:** Floating AI assistant drawer that accompanies students during mock tests and page navigation to provide live voice interaction, hints, and strategy guidance.
- **Props:** `isOpen` (`boolean`), `onClose` (`() => void`), `activeTab` (`string`), `user` (`User`), `profile` (`UserProfile`).
- **Dependencies:** `/api/chat/completions`, `useVoiceInteraction.ts`, `VoiceWaveVisualizer.tsx`, `lucide-react`.
- **Last Updated:** July 21, 2026

| Property | Class / Token |
| :--- | :--- |
| **Drawer Container** | `bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-2xl` |
| **Drawer Header** | `bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 border-b border-slate-800/90 text-white` |
| **Live Voice Button (Active)** | `bg-gradient-to-br from-emerald-500 to-teal-700 border-emerald-600 text-white shadow-emerald-500/30` |
| **Live Voice Button (Inactive)** | `bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:border-emerald-300` |
| **Dictation Overlay Bar** | `bg-slate-950/95 backdrop-blur-xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] rounded-2xl` |
| **Confirm Chip (Check ✓)** | `w-6.5 h-6.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/90 text-emerald-300 hover:text-white border border-emerald-500/40` |
| **Cancel Chip (Close X)** | `w-6.5 h-6.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/90 text-rose-300 hover:text-white border border-rose-500/40` |
| **Mute Toggle Button** | `w-7 h-7 rounded-xl border` (`bg-indigo-50 border-indigo-200 text-indigo-600` / `bg-slate-200 border-slate-300 text-slate-500`) |
| **Text — Primary** | `text-slate-800 text-sm font-normal leading-relaxed` |
| **Text — Secondary** | `text-slate-500 text-xs font-medium` |

**Pattern notes:**
- **Glassmorphic Action Chips**: Dictation confirm `[✓]` and cancel `[X]` buttons MUST use frosted glassmorphic chips (`bg-emerald-500/20`, `bg-rose-500/20`) with hover scale micro-animations instead of solid flat color blocks.
- **Flex Overflow Prevention**: Recording bars and parent flex containers MUST declare `min-w-0` across every container level, and control action buttons MUST declare `shrink-0` to guarantee on-screen visibility.
- **Single-Line Banners**: Labels inside `VoiceWaveVisualizer` MUST enforce `whitespace-nowrap shrink-0` to prevent line wrapping.
- **Auto-Scroll on Refresh/Mount**: Chat message lists in `AiMentor` and `StickyAICompanion` MUST place `<div ref={chatEndRef} />` at the bottom and use a mount `useEffect` to scroll directly to the bottom (`behavior: 'auto'`) on initial page load / refresh so users instantly see their latest messages.
- **Live Voice Control**: Clicking the green `((•))` button or the Red `X` button MUST set `setIsLiveVoiceMode(false)` synchronously to ensure auto-restart hooks cleanly halt.
- **Multi-Chat Session Manager**: OdishaExamPrep AI in `AiMentor.tsx` uses `ChatSession[]` stored in `localStorage` (`oep_ai_chat_sessions`). `+ New Chat` starts a fresh thread while `History 🕒` toggles a slide-over glassmorphic drawer (`bg-white/95 backdrop-blur-xl z-40`) featuring live search, inline title editing, and deletion.
- **Fullscreen Workspace Mode**: Fullscreen mode in `AiMentor.tsx` MUST use `fixed inset-0 z-[100] w-screen h-dvh rounded-none border-none shadow-none bg-white` container styling combined with browser HTML5 `requestFullscreen()` and an `ESC` key `fullscreenchange` event listener to ensure seamless enter/exit behavior across desktop viewports.
- **Smart Auto-Toggle Web Search**: The prompt input box in both `AiMentor.tsx` and `StickyAICompanion.tsx` contains an inline, left-aligned `Globe` button (🌐). As the user types, it automatically triggers a web search query (turns brand-blue) when keywords like "today", "current", "news", or "latest" are matched. The user can click it to manually force active/inactive states.
- **Multimodal Image Attachment Upload**: Uploaded image files (`.png`, `.jpg`, `.jpeg`, `.webp`) convert to base64 Data URLs (`data:image/...`). Express body parser in `server.ts` enforces `limit: '50mb'` to handle high-resolution image uploads cleanly, routing vision payloads `{ type: 'image_url', image_url: { url } }` to `meta/llama-3.2-11b-vision-instruct` with seamless text-model fallback.
- **ChatGPT-Inspired Attachment Tray**: Attached files render inside a clean horizontal flex strip (`overflow-x-auto gap-2.5 py-1 px-1`). Images display as square 64x64px rounded thumbnail tiles (`w-16 h-16 rounded-xl border border-slate-200/90 shadow-xs object-cover`) with hover-overlay `✕` close buttons. Documents display as horizontal mini-cards (`rounded-xl bg-slate-50 border border-slate-200/80 max-w-[220px]`) with a red PDF badge icon, filename, size, and close icon. Sitting inside the input container, 1, 2, 3, or more files line up side-by-side without vertical stacking or overlapping Quick/Best mode buttons.
- **ChatGPT-Style Visual Chat Message Attachment Cards**: Attached images in student chat bubbles render as visual square thumbnail cards (`w-18 h-18 sm:w-22 sm:h-22 rounded-xl border border-white/30 object-cover shadow-md hover:scale-105`) instead of raw filename strings (`[ 📎 Gemini Generated Image... ]`). Clicking any image tile opens an interactive full-screen Lightbox Zoom Modal (`fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md`).

---

### `ChatGPTAttachmentTray`

File: `src/pages/AiMentor.tsx`
Last updated: 2026-07-25

| Property | Class |
| :--- | :--- |
| Background — Container | `bg-white/90` |
| Background — Image Tile | `bg-slate-100` |
| Background — Doc Card | `bg-slate-50` |
| Background — PDF Badge | `bg-rose-50` |
| Border — Container | `border border-slate-200/80` |
| Border — Tile / Card | `border border-slate-200/90` |
| Border radius — Container | `rounded-2xl` |
| Border radius — Tiles / Cards | `rounded-xl` |
| Text — Primary (Filename) | `text-xs font-bold text-slate-800` |
| Text — Secondary (File Size) | `text-[10px] text-slate-400 font-medium font-mono` |
| Spacing — Tray | `mb-2 px-1 py-1` |
| Spacing — Flex Row | `gap-2.5 px-1 py-1 overflow-x-auto no-scrollbar scroll-smooth` |
| Hover state — Image Zoom | `group-hover/thumb:scale-105` |
| Hover state — Dismiss Badge | `bg-slate-950/75 hover:bg-rose-600 text-white` |
| Shadow | `shadow-xs` |

**Pattern notes:**
- Attached files sit inside the input wrapper above the prompt textarea, preventing vertical stacking or button misalignment.
- Image attachments render as 64x64px square thumbnail tiles (`w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover`).
- Document attachments render as horizontal mini-cards (`max-w-[220px]`) with a red PDF badge icon, filename, and size.

---

### `ChatGPTChatAttachmentCards`

File: `src/pages/AiMentor.tsx`
Last updated: 2026-07-25

| Property | Class |
| :--- | :--- |
| Background — Chat Image Tile | `bg-slate-900/40` |
| Background — Doc Mini-Card | `bg-white/15 backdrop-blur-xs` |
| Background — Lightbox Overlay | `bg-slate-950/90 backdrop-blur-md` |
| Background — Lightbox Modal Card | `bg-slate-900 border border-slate-700/80` |
| Border — Chat Image Tile | `border border-white/30` |
| Border — Doc Mini-Card | `border border-white/25` |
| Border radius — Chat Tile / Card | `rounded-xl` |
| Border radius — Lightbox Modal | `rounded-2xl` |
| Text — Doc Filename | `text-xs font-semibold text-white` |
| Text — Lightbox Header | `text-xs font-bold text-slate-300` |
| Spacing — Chat Tile Grid | `flex items-center gap-2 flex-wrap mb-2 pt-0.5` |
| Spacing — Tile Dimensions | `w-18 h-18 sm:w-22 sm:h-22` (72x72px to 88x88px) |
| Hover state — Tile Zoom | `group/chatimg hover:scale-105 active:scale-95 transition-all` |
| Hover state — Zoom Overlay Icon | `opacity-0 group-hover/chatimg:opacity-100 transition-opacity` |
| Shadow | `shadow-md` (tiles), `shadow-2xl` (modal) |

**Pattern notes:**
- Attached images in student chat bubbles render as visual square thumbnail cards instead of raw text filename strings (`[ 📎 Gemini Generated Image... ]`).
- Prompt text stays clean and unpolluted by raw file badges.
- Clicking any image tile opens an interactive full-screen Lightbox Zoom Modal for inspecting uploaded question screenshots.

---

### 5. `SearchableSelect`
- **File Path:** [`src/components/SearchableSelect.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/SearchableSelect.tsx)
- **Category:** Form Control
- **Purpose:** Custom dropdown menu with built-in real-time filter search bar for long option lists.
- **Props:** `options` (`Array<{value: string, label: string}>`, required), `value` (`string`, required), `onChange` (`(val: string) => void`, required), `placeholder` (`string`, optional).

```tsx
import { SearchableSelect } from '../components/SearchableSelect';

<SearchableSelect 
  options={[{ value: 'opsc', label: 'OPSC Civil Services' }, { value: 'ossc', label: 'OSSC CGL' }]}
  value={selectedExam}
  onChange={setSelectedExam}
  placeholder="Select Exam..."
/>
```

---

### 6. `LoadingPortal`
- **File Path:** [`src/components/LoadingPortal.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/LoadingPortal.tsx)
- **Category:** Feedback
- **Purpose:** Renders full-screen backdrop loading state with platform logo and animated pulse spinner during initial app load.

### 7. `YouTubeCarousel`
- **File Path:** [`src/components/YouTubeCarousel.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/YouTubeCarousel.tsx)
- **Category:** Media / Carousel
- **Purpose:** Renders an infinite, auto-scrolling strategy video carousel with dynamic YouTube oEmbed title resolution, keyword category tagging, and an integrated modal video player window.
- **Props:** `videoIds` (`string[]`, optional).
- **Last Updated:** July 20, 2026

| Property | Class / Token |
| :--- | :--- |
| **Carousel Background** | `bg-[#F2EFE9]` |
| **Modal Backdrop** | `backdrop-blur-2xl bg-slate-950/85` |
| **Modal Window Header** | `bg-slate-900 border-b border-slate-800/90` |
| **Video Frame Background** | `bg-black` |
| **Border & Radius** | `border-2 border-slate-800 rounded-2xl sm:rounded-3xl` |
| **Header Text** | `text-slate-100 font-serif font-extrabold` |
| **Modal Close Button** | `w-8 h-8 sm:w-9 sm:h-9 bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl border border-slate-700/60 transition-all duration-200 active:scale-95` |
| **Category Badges** | `Aptitude` (blue), `Strategy` (amber), `General Studies` (emerald), `Language` (purple), `Current Affairs` (rose) |

**Pattern notes:**
- Modal video lightboxes MUST use an integrated top window header bar (`bg-slate-900 border-b border-slate-800`) with the video title on the left and the close button on the top-right corner of the header.
- Never place close buttons directly over embedded `iframe` viewports, as this blocks YouTube's native player controls.
- YouTube video titles MUST be resolved dynamically via the YouTube oEmbed API (`https://noembed.com/embed?url=...`).

---

### 8. `QuizTabChips` (AI Mentor Quizzer)
- **File Path:** [`src/pages/AiMentor.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/pages/AiMentor.tsx#L4851-L4880)
- **Category:** Form Control / Chips
- **Purpose:** Renders dynamic removable topic suggestion chips in the AI MCQ Quizzer workspace with symmetrical, flex-centered vector delete buttons.
- **Last Updated:** July 20, 2026

| Property | Class / Token |
| :--- | :--- |
| **Chip Container** | `inline-flex items-center gap-1.5 px-2.5 py-1 border text-[9px] font-black uppercase tracking-wider rounded-lg transition-all shrink-0 select-none` |
| **Active Chip State** | `bg-teal-500/10 border-teal-500/35 text-[#2563EB] font-bold` |
| **Inactive Chip State** | `bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50` |
| **Delete Icon Button** | `w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-100/80 transition-all ml-0.5 cursor-pointer shrink-0` |
| **Delete Vector Icon** | `<X className="w-2.5 h-2.5 stroke-[2.5]" />` |

**Pattern notes:**
- Removable tag/chip components MUST use Lucide vector icons (`<X className="w-2.5 h-2.5" />`) inside a dedicated flex-centered circular button (`w-3.5 h-3.5 rounded-full flex items-center justify-center`).
- Never use raw font text characters (`"×"` or `"x"`) for dismiss/delete buttons on chips, as font baselines cause vertical misalignment.
- Parent chip containers MUST enforce `inline-flex items-center` cross-axis alignment to keep text labels and close icons on the exact same vertical center line.

---

### 9. `AIDiagnosticsActionPlan` (Analytics Action Plan Cards)
- **File Path:** [`src/AnalyticsView.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/AnalyticsView.tsx#L1649-L1680)
- **Category:** Data Display / Checklist Cards
- **Purpose:** Renders dynamic interactive checklist cards for AI diagnostic recommendations without text truncation, maintaining top alignment across multi-line tasks.
- **Last Updated:** July 20, 2026

| Property | Class / Token |
| :--- | :--- |
| **Card Container** | `p-3.5 sm:p-4 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex items-start gap-3 hover:bg-white hover:border-[#2563EB]/40 transition-all duration-300` |
| **Checked State** | `bg-[#2563EB]/5 border-[#2563EB]/20` |
| **Checkbox Square** | `w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5` |
| **Active Checkbox** | `bg-emerald-500 border-emerald-400 text-white shadow-xs` |
| **Task Typography** | `text-slate-800 text-xs sm:text-sm font-semibold leading-relaxed whitespace-normal break-words` |
| **Checked Typography** | `line-through text-slate-400` |
| **Score Boost Badge** | `px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-lg border border-emerald-200/50 uppercase` |

**Pattern notes:**
- Action plan & checklist items MUST NEVER use `truncate` or `line-clamp-1`; sentence tasks must wrap naturally using `whitespace-normal break-words`.
- Multi-line card containers MUST enforce `flex items-start` top alignment so checkboxes and score boost badges stay anchored at the top row.
- Checkbox indicators MUST use vector `<Check className="w-3.5 h-3.5 text-white stroke-[3]" />` icons instead of raw text checkmarks.

---

### 10. `OnboardingTour` (Guided Interactive Tour)
- **File Path:** [`src/components/OnboardingTour.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/OnboardingTour.tsx)
- **Category:** Feedback / Tour
- **Purpose:** Interactive guided onboarding walkthrough with responsive desktop popover positioning and a dedicated mobile bottom action sheet drawer.
- **Last Updated:** July 21, 2026

| Property | Class / Token |
| :--- | :--- |
| **Card Background** | `bg-white` (Popover & Mobile Drawer) |
| **Backdrop Overlay** | `fill="rgba(15, 23, 42, 0.48)"` (SVG Mask, 0 backdrop blur) |
| **Border & Radius** | `border border-slate-200/90 rounded-2xl sm:rounded-3xl` (Desktop), `rounded-[2rem]` (Mobile Drawer) |
| **Spotlight Ring** | `border-2 border-brand-500 shadow-[0_0_0_2px_rgba(255,255,255,0.8),0_0_25px_rgba(37,99,235,0.7)]` |
| **Text — Primary** | `text-slate-900 font-extrabold text-base sm:text-lg` |
| **Text — Secondary**| `text-slate-600 font-medium text-xs sm:text-sm leading-relaxed` |
| **Step Badge** | `text-brand-600 bg-brand-50 border border-brand-100 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full` |
| **Mobile Drawer Container** | `fixed bottom-0 left-0 right-0 z-[1000] p-4 pb-6` with `w-10 h-1 bg-slate-200 rounded-full mx-auto` |
| **Mobile Location Badge** | `bg-brand-600 text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg animate-bounce` |
| **Pointer Arrow** | `w-3.5 h-3.5 bg-white border-slate-300 rotate-45 shadow-sm z-30` |
| **Primary Action Button** | `bg-brand-600 hover:bg-brand-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md shadow-brand-500/20` |

**Pattern notes:**
- On mobile viewports (<768px), onboarding tour components MUST render as fixed bottom drawer cards (`bottom-0 left-0 right-0`) rather than pixel-positioned floating cards.
- Tour backdrops MUST NOT use heavy `backdrop-blur` filters that obscure the target UI; backdrop overlays must remain transparent (`rgba(15, 23, 42, 0.48)`) so underlying web content stays crystal clear.
- All step card popovers MUST clamp `left` and `top` coordinates between `16px` and `viewportWidth - actualWidth - 16px` to prevent screen boundary clipping.

---

### 11. `VoiceWaveVisualizer`
- **File Path:** [`src/components/VoiceWaveVisualizer.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/VoiceWaveVisualizer.tsx)
- **Category:** Feedback
- **Purpose:** Renders an animated equalizer frequency bar layout indicating active user recording (Speech-to-Text) or active AI speech readout (Text-to-Speech).
- **Props:** `isActive` (`boolean`), `type` (`'listening' | 'speaking'`), `bars` (`number`), `className` (`string`), `label` (`string`).

---

### 12. `SmartSearchPromptInput`
- **File Path:** [`src/pages/AiMentor.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/pages/AiMentor.tsx#L4345-L4390) & [`src/components/StickyAICompanion.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/StickyAICompanion.tsx#L2355-L2370)
- **Category:** Form Control / Interactive Input
- **Purpose:** Chat prompt input fields utilized by both AiMentor and the floating StickyAICompanion, optimized for inline web search auto-toggle and voice dictation support.
- **Props:** Input value and state toggles managed locally inside page contexts.

| Property | Class / Token |
| :--- | :--- |
| **Input Background** | `bg-white` (AiMentor) / `bg-slate-50/70` (StickyAICompanion) |
| **Input Border** | `border border-slate-200/60 focus:border-slate-300/80` (AiMentor) / `border border-slate-200/60 focus:border-brand-400/80` (StickyAICompanion) |
| **Border Radius** | `rounded-xl` (AiMentor) / `rounded-2xl` (StickyAICompanion) |
| **Text — Primary** | `text-slate-800 font-semibold` (AiMentor) / `text-slate-800 font-medium` (StickyAICompanion) |
| **Text — Secondary** | `placeholder:text-slate-500` (AiMentor) / `placeholder:text-slate-450` (StickyAICompanion) |
| **Spacing & Padding** | `pl-9 pr-10 py-2.5` (AiMentor) / `pl-7.5 pr-8 py-2 sm:py-2.5` (StickyAICompanion) |
| **Focus Highlight** | Focus glow overlay: `group-focus-within:opacity-100 blur-sm bg-gradient-to-r from-brand-500/40 to-brand-600/20` (AiMentor) / `focus:bg-white` (StickyAICompanion) |
| **Globe Button (Active)** | `absolute left-2.5 (or left-2) top-1/2 -translate-y-1/2 p-1 rounded-lg border text-brand-600 bg-brand-50 border-brand-200/50 shadow-xs hover:bg-brand-100/50 animate-pulse` |
| **Globe Button (Inactive)** | `absolute left-2.5 (or left-2) top-1/2 -translate-y-1/2 p-1 rounded-lg border text-slate-400 border-transparent hover:text-slate-650 hover:bg-slate-100` |

**Pattern notes:**
- **Symmetric Inline Icons:** Chat input fields MUST place the `Globe` search button (🌐) on the absolute left (`left-2.5` / `left-2`) and the `Mic` dictation button (🎙️) on the absolute right (`right-2.5` / `right-2`).
- **Grounded Auto-Toggle Feedback:** As the user types, the `Globe` icon MUST automatically turn brand-blue and pulse when matching current affairs query keywords (such as "today", "current", "latest", "news", "2026", "opsc", etc.). Manual clicking allows toggling and overrides auto-detection.
- **Line Height Prevention:** Parent divs MUST declare `relative flex-1` to prevent flex boundaries from squishing input elements.

---

### 13. `QuestionBankCard`
- **File Path:** [`src/App.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/App.tsx#L6885-L7080)
- **Category:** Data Display / Card
- **Purpose:** Displays individual downloadable Question Banks and PDF collections with question count indicators, premium/free badges, tagline chips, and interactive view details triggers.
- **Last Updated:** July 25, 2026

| Property | Class / Token |
| :--- | :--- |
| **Background (Desktop Card)** | `bg-white shadow-sm flex flex-col` |
| **Background (Mobile Item)** | `bg-white border border-slate-100 rounded-2xl` |
| **Border & Radius (Desktop)** | `border-slate-200/50 rounded-[2rem]` |
| **Border & Radius (Mobile)** | `border border-slate-100 rounded-2xl` |
| **Hero Image Section** | `h-44 overflow-hidden relative shrink-0 border-b border-slate-100` |
| **Text — Primary Title** | `text-lg font-serif font-extrabold text-slate-900 capitalize tracking-tight leading-snug line-clamp-1` |
| **Text — Secondary Stat** | `text-xs font-bold text-slate-500` |
| **Free Badge** | `px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider rounded border border-emerald-200/40` |
| **Premium Badge** | `px-2 py-0.5 bg-rose-50 text-[#2563EB] text-[8px] font-black uppercase tracking-wider rounded border border-rose-200/40` |
| **Tagline Badge** | `bg-gradient-to-r from-brand-50/70 to-indigo-50/40 px-3 py-1.5 rounded-xl border border-brand-100/30 text-brand-650 text-[10px] font-black uppercase tracking-wider` |
| **Primary Action Button** | `w-full py-3 px-6 rounded-xl font-black text-xs uppercase tracking-wider border border-brand-100 bg-brand-50/40 text-brand-600 shadow-sm` |
| **Hover State** | `hover:border-brand-300/80 hover:-translate-y-1.5 transition-all duration-500 hover:shadow-xl` |

**Pattern notes:**
- **Admin `questionCount` Priority**: Question Bank cards MUST prioritize displaying `item.questionCount` (the total number of questions configured by the admin for the downloadable bank) rather than overwriting it with interactive DB practice test counts.
- **Defensive Tagline Parsing**: Tagline values stored in `questionBanks` table can be either plain strings (`"Concept-Focused Practice"`) or JSON-encoded strings (`{"text": "...", "price": 499}`). Parsers in `App.tsx` and `AdminPanel.tsx` MUST check `trim().startsWith('{')` before parsing JSON to prevent wiping plain text taglines.

---

## Component Dependency Graph

```mermaid
graph TD
    App[App.tsx] --> PageLayout[PageLayout.tsx]
    App --> AnimatedRoutes[AnimatedRoutes.tsx]
    App --> LoadingPortal[LoadingPortal.tsx]

    MockTest[MockTestSystem.tsx] --> MathText[MathTextRenderer.tsx]
    MockTest --> DiagramEngine[UniversalMathDiagramEngine.tsx]
    MockTest --> StickyAI[StickyAICompanion.tsx]

    Admin[AdminPanel.tsx] --> DiagramSelector[DiagramTemplateSelector.tsx]
    Admin --> SearchableSelect[SearchableSelect.tsx]
    Admin --> ChangeImpact[ChangeImpactModal.tsx]

    MathText --> KaTeX[KaTeX Engine]
    MathText --> DOMPurify[DOMPurify Sanitizer]
```

---

## Duplicate Prevention Rules

1. NEVER create another equation renderer; always use `MathTextRenderer.tsx`.
2. NEVER create static image diagrams when `UniversalMathDiagramEngine.tsx` vectors can be used.
3. NEVER write custom dropdown search logic; always reuse `SearchableSelect.tsx`.
4. NEVER build custom full-screen loading spinners; use `LoadingPortal.tsx`.
5. NEVER duplicate top navigation header structures; wrap pages in `PageLayout.tsx`.
6. NEVER create alternative payment unlock overlays outside Razorpay modal handlers in `App.tsx`.
7. NEVER hardcode Bank Category labels in JSX — always derive from `categoryOptions[tMode]` so labels stay in sync with the selected Display Target.

---

### 14. `ContentBankModal` (Add / Edit Content Bank Form)

File: [`src/AdminPanel.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/AdminPanel.tsx)
Last updated: 2026-07-25

| Property | Class |
| --- | --- |
| Background — Modal Overlay | `fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center` |
| Background — Modal Card | `bg-white rounded-[2rem] shadow-2xl` |
| Background — Bottom Section | `bg-slate-50/40 p-6 rounded-3xl border border-slate-200/60 shadow-sm` |
| Background — PDF Link Row | `bg-slate-50/30 p-5 rounded-2xl border border-slate-200/60 shadow-sm` |
| Border — Modal Card | `border border-slate-200/60` |
| Border radius — Modal | `rounded-[2rem]` |
| Border radius — Bottom Panel | `rounded-3xl` |
| Border radius — PDF Row | `rounded-2xl` |
| Text — Section Label | `text-sm font-black text-slate-800 uppercase tracking-wider` |
| Text — Field Label | `text-xs font-black text-slate-600 uppercase tracking-wider` (via `labelClass`) |
| Text — Helper Caption | `text-xs text-slate-400 font-semibold` |
| Text — Tiny Caption | `text-[10px] font-bold text-slate-400 italic` |
| Spacing — Form Grid | `grid grid-cols-1 md:grid-cols-2 gap-6` |
| Spacing — Bottom Section Gap | `flex flex-col gap-5` |
| Input — Background | `bg-slate-50/50 border border-slate-200/80 rounded-xl` (via `inputClass`) |
| Input — Focus | `focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400` |
| Select Wrapper | `relative` with `ChevronDown` icon absolutely positioned `right-3.5 top-1/2 -translate-y-1/2 pointer-events-none` |
| Hover state — Divider Row | `pt-4 border-t border-slate-200/60` |
| Toggle — Off | `bg-slate-200` |
| Toggle — On | `peer-checked:bg-brand-500` |
| Shadow | `shadow-sm` on bottom section panel |
| Accent — Banner (Bank Only) | `bg-amber-50 border-amber-200 text-amber-700 rounded-2xl` |
| Accent — Banner (Practice Only) | `bg-brand-50 border-brand-200 text-brand-700 rounded-2xl` |

**Pattern notes:**
- The modal `case 'banks'` block MUST open with a `const tMode` declaration block before the `return ()` so all conditional vars (`showPdf`, `showTagline`, `showPracticeToggle`, `activeCategoryOptions`) are derived from `formData.target_mode` — this keeps the entire form reactive in one place.
- Bank Category labels MUST come from the `categoryOptions[tMode]` lookup table and NEVER be hardcoded in the JSX `<option>` tags, so switching Display Target instantly remaps the labels without requiring a separate state update.
- The PDF Download Links section, Tagline field, and Image URL field MUST all be conditionally hidden when `tMode === 'practice'` — practice-only banks only need Exam, Title, Category, and Questions Count.
- The "Enable Practice Now" toggle MUST only appear when `tMode === 'both'` — it is redundant for bank-only (always OFF) and practice-only (always ON), and auto-managed by selecting the Display Target card.
- Info banners at the top MUST use amber (`bg-amber-50`) for bank-only and brand-blue (`bg-brand-50`) for practice-only to give immediate visual distinction before the user reads any text.

---

### 15. `DisplayTargetSelector` (3-Card Target Picker)

File: [`src/AdminPanel.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/AdminPanel.tsx)
Last updated: 2026-07-25

| Property | Class |
| --- | --- |
| Background — Card (inactive) | `bg-white` |
| Background — Card (active) | `bg-brand-50` |
| Border — Card (inactive) | `border-2 border-slate-200` |
| Border — Card (active) | `border-2 border-brand-500` |
| Border radius — Card | `rounded-2xl` |
| Text — Card Label (inactive) | `text-xs font-black tracking-tight text-slate-700` |
| Text — Card Label (active) | `text-xs font-black tracking-tight text-brand-700` |
| Text — Card Sub | `text-[10px] font-semibold text-slate-400 leading-tight` |
| Spacing — Card Grid | `grid grid-cols-3 gap-3` |
| Spacing — Card Padding | `p-4` |
| Hover state | `hover:border-brand-300` |
| Shadow — active | `shadow-md shadow-brand-500/10` |
| Icon | `text-xl` emoji, rendered as first item in flex-column |

**Pattern notes:**
- This 3-card picker pattern MUST always use a `grid grid-cols-3 gap-3` layout — never tabs or a single dropdown — so all three options are visually simultaneously visible and comparable.
- Clicking a card MUST also auto-set dependent state (e.g., `hasPracticeMode`) in the same `setFormData` call — never in a separate `useEffect`.
- Active card highlight uses `border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10` (3 properties together) — never just border or background alone.
- Cards use `type="button"` attribute to prevent accidental form submission when clicked inside a `<form>` element.

---

### 16. `BankSubTabSwitcher` (Content Bank vs Practice Mode Switcher)

File: [`src/AdminPanel.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/AdminPanel.tsx)
Last updated: 2026-07-25

| Property | Class |
| --- | --- |
| Container | `flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2 bg-slate-100/90 rounded-2xl border border-slate-200/80 mb-6` |
| Active Tab (Question Banks) | `bg-amber-500 text-white shadow-md shadow-amber-500/20` |
| Active Tab (Practice Mode Sets) | `bg-brand-600 text-white shadow-md shadow-brand-500/20` |
| Active Tab (All Items) | `bg-slate-900 text-white shadow-md shadow-slate-900/20` |
| Inactive Tab | `text-slate-600 hover:text-slate-900 hover:bg-white/50` |
| Badge (Active) | `bg-white/20 text-white` |
| Badge (Inactive) | `bg-slate-200 text-slate-700` |

**Pattern notes:**
- Main Admin Content Banks section MUST separate Question Banks (`target_mode !== 'practice'`) and Practice Sets (`target_mode !== 'bank'`) into dedicated sub-tabs so admins never see Practice Mode quizes mixed into Question Banks.
- Switching sub-tabs MUST automatically adjust `formData.target_mode` when clicking "+ Add New" button.

---

### 17. `ScheduledPracticeBankCard` & `ScheduledMockTestCard` (Scheduled & Dynamic Status Practice Cards)

File: [`src/App.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/App.tsx#L3098-L3312)
Last updated: 2026-07-26

| Property | Class |
| --- | --- |
| Container (Grid Layout) | `h-full flex flex-col justify-between` |
| Background — Card (Upcoming) | `bg-amber-50/10 border-amber-200 cursor-not-allowed` |
| Icon Container (Upcoming) | `bg-gradient-to-br from-amber-400 to-orange-500 shadow-md text-white` |
| Icon Container (Completed) | `bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md text-white` |
| Icon Container (In-Progress) | `bg-gradient-to-br from-amber-400 to-orange-500 shadow-md text-white animate-pulse` |
| Badge — UPCOMING | `bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-widest` |
| Badge — COMPLETED | `bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1` |
| Badge — IN PROGRESS | `bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse` |
| Action Button — Completed | `bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40` (`Retake Practice` + `<RotateCw />`) |
| Action Button — In-Progress | `bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/20 hover:shadow-amber-500/40` (`Continue Practice (X%)` + `<Play />`) |
| Action Button — Unattempted | `premium-gradient text-white shadow-brand-500/10 hover:shadow-brand-500/30` (`Start Practice` + `<ChevronRight />`) |
| Unlock Action Button (Upcoming) | `w-full h-[48px] rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm bg-amber-500/15 border-2 border-amber-400 text-amber-950 shadow-sm cursor-not-allowed mt-auto pointer-events-none` |

**Pattern notes:**
- Scheduled release cards MUST use `h-full flex flex-col justify-between` wrapper to guarantee equal card heights and baseline button alignment across grid rows.
- Action buttons MUST dynamically change label, icon, and color theme based on user progress (`Retake Practice` for completed, `Continue Practice` for in-progress, `Start Practice` for unattempted) rather than generically showing `Start Practice` everywhere.
- Card badges MUST reflect student attempt status at a glance: `COMPLETED` (emerald check), `IN PROGRESS (X%)` (pulsing amber), or `Practice Set` (slate border).
- Mobile list items MUST mirror the exact same badge labels (`COMPLETED`, `IN PROGRESS`) and right indicator icons (`RotateCw`, `Play`, `ChevronRight`).

---

### `NotificationCenter`

File: [`src/components/NotificationCenter.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/NotificationCenter.tsx)
Last updated: 2026-07-25

| Property | Class |
| --- | --- |
| Background — Popover | `bg-white/95 backdrop-blur-3xl` |
| Border — Popover | `border border-white/60` |
| Border radius — Popover | `rounded-3xl` |
| Shadow — Popover | `shadow-[0_20px_50px_rgba(12,35,64,0.15)] premium-shadow` |
| Header — Background | `bg-white/70 backdrop-blur-xs` |
| Header — Border | `border-b border-slate-100` |
| Header — Spacing | `p-4` |
| Header — Title text | `font-extrabold text-sm text-slate-900` |
| Header — Action text | `text-[11px] font-extrabold` (brand-600 for Mark read, slate-500 for Clear) |
| List row — Spacing | `p-3.5` |
| List row — Gap | `gap-3.5` |
| List row — Border | `border-l-2 border-b border-b-slate-100/40` |
| Row state — Unread | `bg-brand-500/[0.02] hover:bg-brand-500/[0.05] border-l-brand-500` |
| Row state — Read | `bg-transparent hover:bg-white/40 border-l-transparent hover:border-l-brand-500/40` |
| Row state — LIVE | `bg-amber-50/60 hover:bg-amber-50 border-l-amber-500` |
| Row state — SOON | `bg-slate-50/50 border-l-slate-200 opacity-80 cursor-default` |
| Icon container | `w-9 h-9 rounded-xl text-white mt-0.5` |
| Icon — new_exam | `bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/15` |
| Icon — new_test | `bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/15` |
| Icon — new_bank | `bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/15` |
| Icon — scheduled_live | `bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25 animate-pulse` |
| Icon — scheduled_upcoming | `bg-gradient-to-br from-slate-400 to-slate-500 shadow-sm` |
| Title text — default | `font-extrabold text-xs text-slate-900 group-hover:text-brand-600` |
| Title text — LIVE | `font-extrabold text-xs text-amber-900 group-hover:text-amber-700` |
| Body text — default | `text-[11px] font-semibold text-slate-500 group-hover:text-slate-600` |
| Body text — LIVE | `text-[11px] font-semibold text-amber-700 group-hover:text-amber-800` |
| Badge — Unread dot | `w-2 h-2 rounded-full bg-brand-500 animate-pulse` |
| Badge — LIVE pill | `px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded uppercase tracking-wide animate-pulse` |
| Badge — SOON pill | `px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-black rounded uppercase tracking-wide` |
| Unread count badge (bell) | `w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full border-2 border-white animate-pulse` |
| Unread count badge (header) | `px-2 py-0.5 text-[10px] font-black text-rose-700 bg-rose-100 rounded-full border border-rose-200 animate-pulse` |
| Bell trigger | `p-2 rounded-xl text-slate-600 hover:text-brand-600 hover:bg-slate-100/80 transition-all duration-200` |
| Scroll container | `max-h-[380px] overflow-y-auto divide-y divide-slate-100/60 premium-scrollbar` |
| Empty state icon | `w-8 h-8 text-brand-500/60 mx-auto animate-bounce` |
| Empty state title | `text-xs font-black text-slate-800` |
| Empty state body | `text-[10px] font-semibold text-slate-400` |

**Pattern notes:**
- The popover uses `rounded-3xl` (not `rounded-2xl`) to feel deliberately distinct from the card modals (`rounded-[2rem]`).
- Notification row icons are always `rounded-xl w-9 h-9` with a `bg-gradient-to-br` two-color gradient. Each notification type gets its own gradient pair — do not mix them.
- LIVE scheduled tests are **always sorted before all other notifications** in the list, regardless of their timestamp. This is enforced in the `useMemo` builder by splitting `liveItems` and `otherItems`.
- UPCOMING (not-yet-live scheduled) notifications are **non-clickable** (`actionType: 'none'`, `cursor-default`). No chevron is rendered for them.
- Empty question banks (0 questions AND 0 pdfLinks) must be filtered out before being added to the notification list. The filter is: `hasQuestions || hasPdfs` must be `true`.
- The bell badge uses `border-2 border-white` to create a cutout effect over the header background.
- Animation entry uses framer-motion `spring` with `damping: 25, stiffness: 300` — do not change to `ease` or `tween` for this component.

---

### `GlobalSearchModal`

File: [`src/components/GlobalSearchModal.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/components/GlobalSearchModal.tsx)
Last updated: 2026-07-25

| Property | Class |
| --- | --- |
| Background — Modal window | `bg-white/80 backdrop-blur-2xl` |
| Border — Modal | `border border-white/60` |
| Border radius — Modal | `rounded-[2rem]` |
| Shadow — Modal | `shadow-[0_25px_60px_-15px_rgba(12,35,64,0.18)] premium-shadow` |
| Backdrop | `bg-slate-900/60 backdrop-blur-md` |
| Search input bar — Background | `bg-white/40` (focuses to `bg-white/70`) |
| Search input bar — Border | `border-b border-slate-100` |
| Search input bar — Focus ring | `focus-within:ring-2 focus-within:ring-brand-500/8 focus-within:border-brand-500/20` |
| Input text | `text-slate-900 font-extrabold text-base sm:text-lg` |
| Input placeholder | `placeholder:text-slate-400` |
| Section heading | `text-[11px] font-black uppercase tracking-wider text-slate-400` |
| Result card — Default | `p-3.5 bg-white/40 hover:bg-white border border-slate-200/50 rounded-2xl` |
| Result card — Exam hover | `hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/5` |
| Result card — Test hover | `hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5` |
| Result card — Bank hover | `hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5` |
| Result card title | `font-extrabold text-xs sm:text-sm text-slate-900` |
| Result card title hover — Exam | `group-hover:text-brand-700` |
| Result card title hover — Test | `group-hover:text-indigo-700` |
| Result card title hover — Bank | `group-hover:text-emerald-700` |
| Result card body | `text-[10px] text-slate-500` |
| Type badge — Mock Test | `bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-black uppercase` |
| Type badge — Scheduled | `bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-black uppercase` |
| Type badge — Practice | `bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg` |
| CTA button — Start Test | `bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-extrabold text-xs` |
| CTA button — Locked | `bg-amber-50 text-amber-800 border border-amber-200/50 rounded-xl` |
| View All button | `py-2 bg-white/40 hover:bg-white border border-slate-200/50 rounded-2xl font-extrabold text-[11px]` |
| Footer bar | `p-3 bg-slate-50 border-t border-slate-100 text-[11px] font-bold text-slate-400` |
| Kbd shortcut chip | `px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]` |
| Scroll container | `flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 premium-scrollbar` |
| Empty state container | `w-12 h-12 rounded-2xl bg-slate-100 text-slate-400` |
| Empty state title | `font-extrabold text-slate-800 text-base` |
| Empty state body | `text-xs text-slate-500` |

**Pattern notes:**
- The modal renders via `createPortal(…, document.body)` so it sits outside the React component tree and always renders above everything. Do not remove the portal.
- The window uses `rounded-[2rem]` (same as card modals in App.tsx) — **not** `rounded-3xl` like the NotificationCenter popover.
- Each content section (Exams, Mock Tests, Practice Sets) uses its own accent color for hover states: `brand-*` for exams, `indigo-*` for tests, `emerald-*` for banks. This must remain consistent — do not mix accent colors across sections.
- The search input has **no visible border** on its container; focus is communicated only via `focus-within:ring-2` and a subtle background shift (`bg-white/40 → bg-white/70`).
- Upcoming/scheduled tests inside the search results are non-clickable (`cursor-not-allowed opacity-85`) with amber theming, matching the same system as `ScheduledMockTestCard`.
- Animation: `spring` with `damping: 25, stiffness: 300`, modal enters from `scale: 0.95, y: -20` (drops down from top, not slides up).

---

### 18. `AdminSortDirectionToggle` (Asc / Desc Pill Group)

File: [`src/AdminPanel.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/AdminPanel.tsx)
Last updated: 2026-07-25

| Property | Class |
| --- | --- |
| Background | `bg-white/80 p-1 rounded-xl border border-slate-200/80 shadow-2xs` |
| Border | `border border-slate-200/80` |
| Border radius | `rounded-xl` (container) / `rounded-lg` (each button) |
| Button — inactive | `px-3 py-1 rounded-lg text-xs font-black text-slate-600 hover:text-slate-900` |
| Button — active | `px-3 py-1 rounded-lg text-xs font-black bg-brand-600 text-white shadow-xs` |
| Spacing | `gap-1` between buttons, `p-1` container padding |
| Shadow | `shadow-2xs` on container, `shadow-xs` on active button |
| Accent usage | `bg-brand-600` for active state — always brand, never amber or indigo |

**Pattern notes:**
- This toggle group MUST always use `bg-brand-600 text-white shadow-xs` for the active segment and `text-slate-600 hover:text-slate-900` (no background) for the inactive one.
- The container pill uses `bg-white/80` (slightly translucent) against the `bg-slate-100/90` sub-header backdrop — do not use `bg-white` which would look too heavy.
- This component controls `bankSortDirection` state (`'asc' | 'desc'`) — any new admin section adding a sort toggle MUST follow this same pill group pattern and state shape.
- Border radius: outer container is `rounded-xl`, each button inside is `rounded-lg` — the tighter inner radius prevents visual overcrowding.

---

### 19. `InlineOrderInput` (Numeric Sort Order Field in Table Rows)

File: [`src/AdminPanel.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/AdminPanel.tsx)
Last updated: 2026-07-25

| Property | Class |
| --- | --- |
| Background | `bg-slate-50/50` |
| Border | `border border-slate-200` |
| Border radius | `rounded-lg` |
| Text | `text-center font-black` (always centered, always black weight) |
| Size | `w-16 px-2 py-1` |
| Focus state | `focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none` |
| Shadow | `shadow-sm` |
| Transition | `transition-all` |

**Pattern notes:**
- The input auto-saves to Supabase **on `Blur` and on `Enter` keydown** — never on every keystroke. The `onChange` handler updates local `items` state immediately for visual responsiveness, but the actual save (`handleBankInlineOrderChange` / `handleInlineOrderChange`) fires only on Blur or Enter.
- The save function MUST check `newVal !== originalSortOrder` before calling Supabase to avoid unnecessary DB writes on focus-without-change.
- Table column layout when ORDER is present: `col-span-1` checkbox · `col-span-1` order input · `col-span-5` basic info · `col-span-2` details · `col-span-3` actions = **12 total**.
- Table column layout when ORDER is absent (other tabs): `col-span-1` checkbox · `col-span-5` basic info · `col-span-3` details · `col-span-3` actions = **12 total**.
- The `sortOrder` column in Supabase defaults to `null` — items without a sortOrder sort to position 9999 (end of list) on client. Do not use 0 as a default — 0 would wrongly push null-order items to the top.

---

### 20. `CategoryHierarchyPillBar` (Content Banks Hierarchy Pill Bar)

File: [`src/AdminPanel.tsx`](file:///c:/Users/Naresh%20Samal/Downloads/OdishaExamPrep%20Website/src/AdminPanel.tsx)
Last updated: 2026-07-26

| Property | Class |
| --- | --- |
| Container | `flex flex-wrap items-center gap-2 p-2 bg-white/80 rounded-2xl border border-slate-200/80 shadow-2xs` |
| Category pill — active | `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-slate-900 text-white shadow-md shadow-slate-900/10` |
| Category pill — inactive | `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60` |
| Badge — active pill | `px-2 py-0.5 rounded-md text-[10px] font-black bg-white/20 text-white` |
| Badge — inactive pill | `px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-200/80 text-slate-700` |
| Hierarchy Label | `text-xs font-black uppercase tracking-wider text-slate-400 px-3 py-1` |

**Pattern notes:**
- **Pill Count Calculation**: Pill counts must **never be filtered by `bankSubTab`** (`banks`, `practice`). They calculate true total count per category across all modes (`matchExam && matchCat`), guaranteeing counts like High-Yield (6) remain visible even when viewing Question Banks (Step 1).
- **Auto-Switching Sub-Tab**: Clicking a category pill automatically sets both `bankFilter` state AND `bankSubTab` state via `autoTab`:
  - `🌟 All Categories` → `autoTab: 'all'`
  - `📘 Chapter-Wise Practice` → `autoTab: 'banks'`
  - `🎯 High-Yield Topic` → `autoTab: 'practice'`
  - `⚡ Daily Speed Quiz` → `autoTab: 'practice'`
  - `📜 Topic-Wise PYQ` → `autoTab: 'practice'`
- This prevents admins from seeing a 0-item empty view when selecting a category that only has practice-mode items while sitting on the Question Banks sub-tab.
