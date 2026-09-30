# OdishaExamPrep Architecture & Guardrail Policy

**True Platform Stack:**
- **Frontend:** Vite 6 (SPA) + React 19 + Framer Motion + Tailwind CSS v4
- **Backend/API:** Node.js + Express (`server.ts`) + esbuild
- **Database & Auth:** Supabase Auth & PostgreSQL
- **CRITICAL:** Do NOT assume Next.js, Next.js App Router, or Next.js server components. This is a Vite React SPA with an Express API/SSR server.

---

## Read Before Anything Else

Read in this exact order before any implementation:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/invariants.md`
4. `context/ui-tokens.md`
5. `context/ui-rules.md`
6. `context/ui-registry.md`
7. `context/code-standards.md`
8. `context/library-docs.md`
9. `context/build-plan.md`
10. `context/progress-tracker.md`

---

## Rules That Never Change

- **Strict Non-Destructive Guardrail Policy:** Never delete, hide, or degrade working features.
- **No Responsive Hiding:** Never add `md:hidden`, `sm:hidden`, `lg:hidden`, or `hidden` to existing navigation or primary controls without explicit user instruction.
- **Zero-Blank Fallback Guarantee:** Always provide curated fallback data for dynamic components (never use `if (data.length === 0) return null;` on primary dashboard cards).
- **Mandatory Invariant Check:** Run `npm run test:invariants` after modifying UI or components. If an invariant is violated, fix the line immediately.
- **Never use hardcoded hex values or raw Tailwind color classes:** Always use semantic tokens from `context/ui-tokens.md`.
- **Update documentation:** Update `progress-tracker.md` and `ui-registry.md` after every feature.
- **Third-party libraries:** Load its installed skill first, then read `context/library-docs.md` for project-specific rules.
- **Recover promptly:** If the same problem persists after one corrective prompt — stop immediately and run `/recover`.

---

## Available Skills

- `/architect` — before any complex feature. Think before building.
- `/imprint` — after any new UI component. Capture patterns.
- `/review` — before demo or when something feels off.
- `/recover` — when something breaks after one failed correction.
- `/remember save` — when a feature spans multiple sessions.
- `/remember restore` — when returning after a multi-session feature.
