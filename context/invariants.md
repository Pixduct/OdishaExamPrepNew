# Platform Invariants & Non-Destructive Guardrail Contract — OdishaExamPrep

> **OdishaExamPrep** (`https://www.odishaexamprep.in`)  
> Authoritative Reference for AI Assistants & Software Engineers.  
> **Rule of Law:** Under ZERO circumstances may any AI assistant or developer delete, degrade, hide, or silently break any invariant documented in this contract.

---

## Purpose & Engineering Law

This document exists to eliminate AI hallucination, context loss, and uninstructed regressions across the full-stack codebase.

When AI assistants modify code, they often view components in isolation and assume that a bottom bar is "only for mobile", or that an empty database row should make a component return `null`. This breaks working features on production without any syntax error.

**The Golden Law:**
1. **Never Break Working Features:** If a feature is already working, it is strictly forbidden to delete, disable, or hide it.
2. **Explainable Restriction:** Any attempt to break an invariant will trigger a hard block during `npm run test:invariants` and `npm run build`, outputting an actionable red diagnostic box with file, line number, and fix instructions.
3. **Zero Developer Friction:** Normal feature additions (new pages, new routes, exam series, styling updates, backend APIs) are completely unconstrained and run at full speed (<200ms).

---

## 25 Non-Negotiable Platform Invariants

### Category A: Navigation & Shell Visibility
| ID | Invariant Name | Protected File & Target | Constraint & Rule |
| :--- | :--- | :--- | :--- |
| **#01** | **Universal Bottom Nav Visibility** | `src/App.tsx` (`<motion.nav>`) | Must NEVER contain `md:hidden`, `lg:hidden`, or `sm:hidden`. Bottom navigation dock MUST remain visible across desktop, tablet, and mobile. |
| **#02** | **6 Core Primary Tabs** | `src/App.tsx` | All 6 primary tabs (`Home`, `Study Plan`, `Analytics`, `History`, `Library`, `AI Mentor`) must remain present in the dock. |
| **#03** | **Collapsible Navigation Controls** | `src/App.tsx` | Must retain `setIsBottomNavVisible(false)` chevron minimize toggle and `setIsBottomNavVisible(true)` floating restore tab. |
| **#04** | **Dynamic Main Clearance** | `src/App.tsx` (`<main>`) | Dynamic bottom padding (`isBottomNavVisible ? "pb-20 sm:pb-24 lg:pb-28" : "pb-6 sm:pb-12 lg:pb-16"`) must prevent dock content clipping. |
| **#05** | **Header Brand Identity** | `src/App.tsx` (`<Navbar>`) | Official logo mark and `OdishaExamPrep` wordmark with `#2563EB` accent and scroll-to-top handler must remain mounted. |
| **#06** | **Header Direct Navigation** | `src/App.tsx` (`<Navbar>`) | Desktop top header must provide direct links to `/current-affairs` and `/blog`. |
| **#07** | **Header Utility Matrix** | `src/App.tsx` (`<Navbar>`) | Header utility cluster must render Search (`Ctrl+K`), `NotificationCenter`, Streak pill, `LanguageToggle`, and `ThemeToggle`. |
| **#08** | **Mobile Drawer Matrix** | `src/App.tsx` (`<Navbar>`) | Mobile hamburger drawer must render staggered navigation links, language/theme bar, video guide button, and WhatsApp support. |

### Category B: Canvas & Vector Background Continuity
| ID | Invariant Name | Protected File & Target | Constraint & Rule |
| :--- | :--- | :--- | :--- |
| **#09** | **Vector Canvas Grid Matrix** | `src/App.tsx` | Signature dot grid matrix `[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] dark:[radial-gradient(#fff_1.2px,transparent_1.2px)]` must remain mounted on guest and dashboard layouts. |
| **#10** | **Ambient HSL Glow Orbs** | `src/App.tsx` | Fixed dual ambient lighting blur orbs (`bg-brand-300/20` and `bg-indigo-200/15` with `blur-3xl`) must be mounted for spatial depth. |
| **#11** | **Floating Study Watermarks** | `src/App.tsx` | 4 floating vector watermark symbols (`GraduationCap`, `BookOpen`, `Award`, `Compass`) with `stroke-[1.2]` must rotate and drift in background. |
| **#12** | **Hardware Mouse Tracking** | `src/App.tsx` | GPU-accelerated cursor spotlight `<MouseTrackingCanvas />` and `<VectorCursorFollower />` must remain active on desktop. |

### Category C: Defensive Component Fallbacks (Zero-Blank Guarantee)
| ID | Invariant Name | Protected File & Target | Constraint & Rule |
| :--- | :--- | :--- | :--- |
| **#13** | **YouTube Curated Video Fallback** | `src/components/YouTubeCarousel.tsx` | Must define `DEFAULT_FALLBACK_VIDEO_IDS = ['jNQXAC9IVRw', 'dQw4w9WgXcQ', 'EngW7tCbLHY']` and fallback when DB settings are empty. |
| **#14** | **YouTube Carousel Mounting** | `src/App.tsx` | Must remain mounted above the Admin Control Center in `DashboardContent` when `!selectedExam`. |
| **#15** | **Infinite Loop Scroll Physics** | `src/components/YouTubeCarousel.tsx` | Track must triple items (`[...sourceVideos, ...sourceVideos, ...sourceVideos]`) with modulo offset wrapping. |
| **#16** | **Dynamic Title Ingestion** | `src/components/YouTubeCarousel.tsx` | Must dynamically query `noembed.com/embed` for video titles with fallback to `staticMapping`. |

### Category D: Route Coverage & Modal Accessibility
| ID | Invariant Name | Protected File & Target | Constraint & Rule |
| :--- | :--- | :--- | :--- |
| **#17** | **100% Core Route Mapping** | `src/App.tsx` (`<AnimatedRoutes>`) | All routes in `routes-config.ts` must have active `<Route>` elements. Zero orphaned or unmapped routes. |
| **#18** | **Global Search Shortcut** | `src/App.tsx` | Keyboard listener for `Ctrl+K` / `⌘K` must remain mounted globally to toggle `<GlobalSearchModal />`. |
| **#19** | **Streak Manager & Modal** | `src/App.tsx` | `getStreakState()` and `oep-open-streak-modal` listener must remain connected to `<StreakDetailModal />`. |
| **#20** | **Sticky AI Companion** | `src/App.tsx` | `<StickyAICompanion />` must remain mounted on non-admin routes with dynamic `isBottomNavVisible` vertical offset. |
| **#21** | **WhatsApp Direct Support** | `src/App.tsx` | `<WhatsAppButton />` must remain mounted on all candidate routes. |
| **#22** | **Web Push Notification Engine** | `src/App.tsx` | `<PushPermissionPrompt />` must remain active for authenticated candidate alerts. |
| **#23** | **Password Recovery Modal** | `src/App.tsx` | `<AnimatePresence>` reset password modal with credential validation must remain accessible. |
| **#24** | **Legal Page Compliance** | `src/PrivacyPolicy.tsx` | Privacy Policy, Terms, and Refund Policy must wrap inside `<PageLayout backTo={{...}}>`. |
| **#25** | **Virtual Office Launcher** | `src/App.tsx` | Key listener `Ctrl+Alt+O` opening `/virtual-office.html` must remain active for administrative monitoring. |

---

## Defensive Coding Rules (Strictly Enforced)

1. **The Zero-Blank Fallback Rule:**
   - Any component that fetches remote data from Supabase, REST APIs, or local storage MUST provide curated, hardcoded fallback data.
   - It is strictly forbidden to write `if (data.length === 0) return null;` on primary dashboard cards. Always render the fallback state.

2. **The Responsive Visibility Rule:**
   - Never add `md:hidden`, `sm:hidden`, `lg:hidden`, or `hidden` to existing navigation components without explicit, written instruction from the user.
   - If an element needs mobile optimization, use responsive sizing (`px-2 sm:px-8`, `text-xs sm:text-sm`) instead of hiding the entire element on desktop.

3. **The Mechanical Verification Rule:**
   - Before finishing any session or claiming a task is done, run:
     ```bash
     npm run test:invariants
     ```
   - If any violation is flagged, read the terminal output and fix the line immediately before proceeding.

---

## Developer Override Workflow

If the **platform owner (User)** explicitly instructs you to redesign, replace, or retire one of these 25 protected features (e.g. *"Replace the bottom dock with a left sidebar"*):
1. Confirm the user's intent.
2. Update the corresponding check in `scripts/verify-invariants.ts`.
3. Update this document (`context/invariants.md`).
4. Re-run `npm run test:invariants` to verify the updated invariant suite passes.
