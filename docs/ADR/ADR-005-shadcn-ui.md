# ADR-005: shadcn/ui + Tailwind CSS v4 for UI

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-09 |
| **Decision Makers** | Solutions Architect |
| **References** | [FRONTEND_ARCHITECTURE.md](../plans/FRONTEND_ARCHITECTURE.md), [PLAN.md](../plans/PLAN.md) |

---

## Context

Aura's dashboard requires a component library for common UI elements: buttons, cards, tables, dialogs, progress bars, forms, and navigation. The library must integrate cleanly with Next.js and Tailwind CSS.

---

## Decision

**Use shadcn/ui with Tailwind CSS v4 as the UI component library.**

---

## Options Considered

### Option A: shadcn/ui + Tailwind CSS v4 — **CHOSEN**

**Pros:**
- **Copy-paste components** — no external dependency, full control over source code
- **Radix UI primitives** underneath — accessible, composable, unstyled headless components
- **Native Recharts wrapper** — `chart.tsx` component integrates Recharts into the design system
- **Tailwind CSS v4** — faster builds, CSS-first configuration, native cascade layers
- **Dark mode support** — built into every component via CSS variables
- **Customizable** — modify any component's source directly, no upstream breaking changes
- **Large ecosystem** — extensive examples, blocks, and themes
- **CLI tooling** — `npx shadcn@latest add button` scaffolds components instantly

**Cons:**
- Components are copied into the project — must maintain/update manually
- Tailwind CSS v4 is newer — some community plugins may not be compatible yet
- No pre-built dashboard templates (must compose from primitives)
- Styling is utility-class heavy — can lead to long className strings

### Option B: Chakra UI

**Pros:**
- Comprehensive component library with theming
- Good accessibility defaults
- Style props approach (no utility classes)

**Cons:**
- Runtime CSS-in-JS — larger bundle, slower than Tailwind
- Less compatible with React Server Components
- Heavier dependency footprint

### Option C: Material UI (MUI)

**Pros:**
- Most comprehensive component library
- Material Design system for consistent UX
- Extensive documentation

**Cons:**
- Very opinionated styling — hard to make it look "non-Material"
- Large bundle size
- Runtime styling conflicts with RSC
- Steep learning curve for theming customization

### Option D: Tremor (dashboard-specific)

**Pros:**
- Purpose-built for dashboard UIs — charts, KPIs, tables
- Built on Tailwind CSS
- Less code needed for common dashboard patterns

**Cons:**
- Less flexible for non-dashboard pages (auth, settings, forms)
- Smaller component selection
- Charts are Recharts under the hood — shadcn/ui provides the same via its `chart` component
- Less community adoption

---

## Consequences

### Positive
- Zero-dependency UI — components live in `src/components/ui/`, no npm package to version
- Recharts integration via `chart.tsx` means pie charts and progress bars use the same design tokens
- Tailwind v4 CSS-first approach reduces build-time config complexity
- Dark mode is trivial — shadcn components respect `dark:` variants automatically
- Full control over accessibility — can modify Radix primitives to meet WCAG requirements

### Negative
- Must manually update components when shadcn/ui releases improvements (check diff periodically)
- Team must understand Tailwind CSS utility classes
- No pre-built "expense dashboard" template — must compose the layout from primitives
