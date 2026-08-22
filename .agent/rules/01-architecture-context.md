# 01 — Architecture & Context Engine

This document is the single source of truth for the core architecture, technical stack, design token standards, and engineering rules of **OdishaExamPrep** (`https://www.odishaexamprep.in`).

---

## 1. Full Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend SPA** | React | `19.0.0` | Declarative UI component tree & interactive client state |
| **Build & Dev Tool** | Vite | `6.2.0` (`@vitejs/plugin-react`) | Rapid HMR development & optimized production asset bundling |
| **CSS & Design Engine**| Tailwind CSS | `4.1.14` (`@tailwindcss/vite`) | Zero-runtime CSS design token system & utility styling |
| **Type Safety** | TypeScript | `~5.8.2` | Strict end-to-end static type validation (`tsc --noEmit`) |
| **Routing** | React Router DOM | `7.14.0` | Client-side route matching, guarded views, dynamic params |
| **Animations** | Framer Motion & Motion | `12.38.0` / `12.23.24` | Spring physics micro-interactions and smooth page transitions |
| **Smooth Physics** | Lenis Scroll | `1.3.26` | Hardware-accelerated inertial momentum scrolling |
| **Math Rendering** | KaTeX | `0.17.0` | Ultra-fast LaTeX formula rendering (`$...$`, `$$...$$`) |
| **Charts & Graphs** | Recharts | `3.8.1` | Native React SVG performance charts & radar analytics |
| **Sanitization** | DOMPurify | `3.4.1` | XSS attack sanitization for dynamic user/math content |
| **Mobile Hybrid** | Capacitor | `8.4.1` | Native Android APK bridge and platform runtime container |
| **Backend API** | Node.js + Express | Node v22+ / Express `4.21.2` | REST endpoints, Razorpay orders, VAPID push, AI Proxy |
| **Database & Auth** | Supabase | `@supabase/supabase-js 2.103.0` | PostgreSQL database, RLS security policies, Auth sessions |
| **AI Inference** | NVIDIA NIM API | Meta Llama 3.1 8B / DeepSeek | Real-time AI mentor chat completions with SSE streaming |
| **Push Notifications**| WebPush | `3.6.7` | VAPID key-signed browser & PWA push alerts |

---

## 2. Design System & Theme Tokens

All global styling is defined via `@theme` in `src/index.css` under Tailwind CSS v4:

### A. Typography & Fonts
- `--font-sans`: `"Plus Jakarta Sans", "Noto Sans Oriya", ui-sans-serif, system-ui, sans-serif` (Primary clean UI)
- `--font-serif`: `"Fraunces", "Noto Serif Oriya", Georgia, serif` (Editorial accent headings)
- `--font-odia`: `"Noto Sans Oriya", "Plus Jakarta Sans", sans-serif` (State Odia language content)

### B. Color Tokens
- **Brand Palette:**
  - `brand-50`: `#eff6ff`
  - `brand-100`: `#dbeafe`
  - `brand-200`: `#bfdbfe`
  - `brand-300`: `#93c5fd`
  - `brand-400`: `#60a5fa`
  - `brand-500`: `#2563eb` (Primary interactive color)
  - `brand-600`: `#1d4ed8` (Primary button fill & CTA)
  - `brand-700`: `#1e40af`
  - `brand-800`: `#1e3a8a`
  - `brand-900`: `#172554`
  - `brand-950`: `#0f172a` (Hero headers, dark surface accents)
- **Status & Accent Tokens:**
  - `slate-950`: `#0d1117`
  - `indigo-650`: `#4338ca` (AI and premium badges)
  - `emerald-650`: `#047857` (Correct answers, active pass badges)
  - `amber-650`: `#b45309` (Alerts, review flags, pending notices)
- **Base Background:** `#FBF9F6`

---

## 3. Strict Engineering & Coding Rules

1. **Tailwind CSS v4 Standard:**
   - Always use official Tailwind v4 classes and theme tokens (`bg-brand-600`, `text-slate-900`, `rounded-2xl`).
   - Never use raw hardcoded hex codes in component markup when a design token exists.
   - Always merge dynamic or conditional Tailwind classes using `cn()` from `@/lib/utils` or `../lib/utils`.

2. **TypeScript Strictness:**
   - Strict typing is mandatory (`tsc --noEmit` must pass with zero errors).
   - Export and reuse explicit TypeScript interfaces for props and database records. Avoid `any`.

3. **Component Modularity & Single Responsibility:**
   - Group reusable UI components in `src/components/`.
   - Math equations MUST always pass through `MathTextRenderer.tsx`.
   - Geometric figures MUST always use `UniversalMathDiagramEngine.tsx`.
   - Never instantiate Supabase clients inside UI components; use singleton `supabase` from `src/lib/supabase.ts`.

4. **Security & Data Safety:**
   - Secret keys (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`) belong exclusively in backend `server.ts`.
   - All dynamic HTML must be sanitized using `DOMPurify`.
   - Razorpay transaction amounts must always be resolved and validated on the backend.
