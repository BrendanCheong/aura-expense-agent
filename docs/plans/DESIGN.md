# Aura Expense Agent — Design System

> **Version:** 1.0  
> **Last Updated:** 2026-02-13  
> **Status:** Approved  
> **References:** [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md), [ADR-005](../ADR/ADR-005-shadcn-ui.md), [UX_DECISIONS.md](./UX_DECISIONS.md)

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Aesthetic Direction](#2-aesthetic-direction)
3. [Typography](#3-typography)
4. [Color System](#4-color-system)
5. [Spatial System & Layout](#5-spatial-system--layout)
6. [Motion & Animation](#6-motion--animation)
7. [Backgrounds & Atmosphere](#7-backgrounds--atmosphere)
8. [Component Styling](#8-component-styling)
9. [Dark & Light Mode Strategy](#9-dark--light-mode-strategy)
10. [Iconography](#10-iconography)
11. [Anti-Patterns (What We Avoid)](#11-anti-patterns-what-we-avoid)
12. [Implementation Conventions](#12-implementation-conventions)

---

## 1. Design Philosophy

Aura is a **personal finance intelligence system**. It should feel like a premium, private cockpit for your money — not a toy, not a spreadsheet, not a generic SaaS dashboard. Every visual decision should communicate three things:

| Principle               | Meaning                                                             | Execution                                                                            |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Precision**           | Financial data demands trust and clarity                            | Monospace amounts, sharp alignment, zero visual ambiguity                            |
| **Calm Authority**      | Money is emotional — the UI should be a calming, confident presence | Deep muted tones, generous whitespace, deliberate restraint                          |
| **Living Intelligence** | The AI agent is always working behind the scenes                    | Subtle aurora-inspired glows, gentle pulse animations on new data, organic gradients |

> **Mantra:** _"Design as if the user trusts you with their entire financial life."_

---

## 2. Aesthetic Direction

### Concept: **"Aurora Noir"**

The app is called **Aura**. The visual identity draws from the **aurora borealis** — natural, luminous, otherworldly — but executed through a **high-end fintech lens**. Dark, atmospheric, with selective moments of luminous color that feel earned, not decorative.

**Tone:** Refined luxury meets futuristic data visualization. Closer to a Bloomberg terminal reimagined by a Japanese design studio than a typical SaaS dashboard.

**Mood Board References:**

- Linear's dark mode (spatial depth, restraint)
- Stripe's data visualization (precision, confidence)
- Raycast's glass-morphism (atmospheric, modern)
- The color language of aurora borealis photography (teal, emerald, cyan shifting across a dark sky)

### What Makes Aura Unforgettable?

**The "Aurora Glow"** — A signature ambient light effect that appears throughout the interface:

- Sidebar has a barely perceptible teal→emerald gradient edge
- Active chart segments emit a soft luminous halo
- Budget bars pulse with a breathing glow when approaching thresholds
- New transactions fade in with a brief aurora shimmer

This is the one thing a user remembers: _"The app that glows."_

---

## 3. Typography

### Font Stack

| Role        | Font                 | Source       | Weight Range           | Fallback                |
| ----------- | -------------------- | ------------ | ---------------------- | ----------------------- |
| **Display** | **Instrument Serif** | Google Fonts | 400 (regular + italic) | Georgia, serif          |
| **Heading** | **Syne**             | Google Fonts | 500–800                | system-ui, sans-serif   |
| **Body**    | **Outfit**           | Google Fonts | 300–600                | system-ui, sans-serif   |
| **Mono**    | **JetBrains Mono**   | Google Fonts | 400–600                | ui-monospace, monospace |

### Why These Fonts?

- **Instrument Serif** — An elegant, slightly warm serif that is profoundly unexpected for a fintech app. Used for the logo wordmark, large hero numbers (total spent), and empty-state headlines. Creates instant personality. The italic style adds editorial flair to pull-quotes and onboarding copy.

- **Syne** — A futuristic geometric sans designed by the French foundry Bonjour Monde. Its slightly extended letterforms and distinctive `g` and `a` give section headers a commanding, modern presence without resorting to overused geometric fonts.

- **Outfit** — A geometric sans-serif with excellent readability at small sizes and a distinctive character (the rounded terminals on `a`, `e`, `s`). Used for all body text, form labels, table content. Warmer than Inter, more refined than DM Sans.

- **JetBrains Mono** — The best monospace font for financial data. Consistent digit widths mean dollar amounts align perfectly in tables. Ligatures disabled for clarity.

### Type Scale

```css
/* CSS Custom Properties */
--font-display: 'Instrument Serif', Georgia, serif;
--font-heading: 'Syne', system-ui, sans-serif;
--font-body: 'Outfit', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;

/* Scale (1.250 — Major Third) */
--text-xs: 0.64rem; /* 10.24px — captions, badges */
--text-sm: 0.8rem; /* 12.80px — secondary text */
--text-base: 1rem; /* 16.00px — body text */
--text-lg: 1.25rem; /* 20.00px — card titles */
--text-xl: 1.563rem; /* 25.00px — section headers */
--text-2xl: 1.953rem; /* 31.25px — page titles */
--text-3xl: 2.441rem; /* 39.06px — hero numbers */
--text-4xl: 3.052rem; /* 48.83px — display/logo */

/* Letter spacing */
--tracking-tight: -0.02em; /* headings */
--tracking-normal: 0em; /* body */
--tracking-wide: 0.05em; /* mono, badges, overlines */

/* Line height */
--leading-tight: 1.2; /* headings, display */
--leading-normal: 1.6; /* body text */
--leading-relaxed: 1.8; /* long-form, descriptions */
```

### Usage Rules

| Context                  | Font             | Size        | Weight | Tracking  |
| ------------------------ | ---------------- | ----------- | ------ | --------- |
| App wordmark "Aura"      | Instrument Serif | `text-4xl`  | 400    | `-0.03em` |
| Total spent amount       | Instrument Serif | `text-3xl`  | 400    | `-0.02em` |
| Page title ("Dashboard") | Syne             | `text-2xl`  | 700    | `-0.02em` |
| Section header           | Syne             | `text-xl`   | 600    | `-0.01em` |
| Card title               | Syne             | `text-lg`   | 600    | `0em`     |
| Body text                | Outfit           | `text-base` | 400    | `0em`     |
| Secondary text           | Outfit           | `text-sm`   | 400    | `0em`     |
| Dollar amounts           | JetBrains Mono   | `text-base` | 500    | `0.02em`  |
| Table data               | Outfit           | `text-sm`   | 400    | `0em`     |
| Badge text               | Outfit           | `text-xs`   | 600    | `0.05em`  |
| Overline labels          | Syne             | `text-xs`   | 700    | `0.08em`  |

---

## 4. Color System

### Design Token Architecture

All colors defined as CSS custom properties with **HSL values** for easy manipulation. The system uses semantic tokens that resolve differently in dark/light mode.

### Dark Mode Palette (Primary)

```css
:root[data-theme='dark'] {
  /* Backgrounds — Deep space with cool blue undertone */
  --bg-primary: hsl(222, 47%, 5%); /* #070B14 — app background */
  --bg-surface-1: hsl(222, 30%, 8%); /* #0F1420 — card background */
  --bg-surface-2: hsl(222, 25%, 13%); /* #171D2E — elevated surface */
  --bg-surface-3: hsl(222, 22%, 18%); /* #1E2640 — hover/active */

  /* Text */
  --text-primary: hsl(210, 20%, 95%); /* #F0F2F5 — primary text */
  --text-secondary: hsl(215, 15%, 60%); /* #8A94A6 — secondary text */
  --text-muted: hsl(218, 12%, 40%); /* #5A6173 — disabled/subtle */

  /* Borders */
  --border-subtle: hsl(222, 20%, 15%); /* #1E2433 — card borders */
  --border-default: hsl(222, 18%, 22%); /* #2D3548 — input borders */
  --border-strong: hsl(222, 15%, 30%); /* #3E4760 — focus rings */
}
```

### Light Mode Palette

```css
:root[data-theme='light'] {
  /* Backgrounds — Warm parchment, NOT pure white */
  --bg-primary: hsl(40, 20%, 97%); /* #F8F6F2 — app background */
  --bg-surface-1: hsl(0, 0%, 100%); /* #FFFFFF — card background */
  --bg-surface-2: hsl(40, 15%, 96%); /* #F4F2ED — elevated surface */
  --bg-surface-3: hsl(40, 12%, 92%); /* #ECE9E3 — hover/active */

  /* Text */
  --text-primary: hsl(222, 47%, 11%); /* #0D1321 — primary text */
  --text-secondary: hsl(218, 15%, 45%); /* #636E83 — secondary text */
  --text-muted: hsl(216, 10%, 65%); /* #9BA3B0 — disabled/subtle */

  /* Borders */
  --border-subtle: hsl(40, 10%, 90%); /* #E6E3DD — card borders */
  --border-default: hsl(40, 8%, 85%); /* #DAD7D0 — input borders */
  --border-strong: hsl(40, 6%, 75%); /* #C2BFB8 — focus rings */
}
```

### Accent Colors (Shared)

These work on both dark and light backgrounds:

```css
:root {
  /* Aura Teal — Primary brand color, positive actions */
  --accent-primary: hsl(165, 100%, 42%); /* #00D4AA */
  --accent-primary-hover: hsl(165, 100%, 48%); /* #00F5C5 */
  --accent-primary-muted: hsl(165, 60%, 20%); /* Dark: subtle bg tint */
  --accent-primary-glow: hsla(165, 100%, 50%, 0.15); /* Aurora glow effect */

  /* Cyan — Secondary, informational */
  --accent-cyan: hsl(195, 100%, 50%); /* #00BFFF */
  --accent-cyan-muted: hsl(195, 60%, 18%);

  /* Amber — Warnings, budget approaching */
  --accent-amber: hsl(38, 100%, 56%); /* #FFB020 */
  --accent-amber-muted: hsl(38, 60%, 18%);

  /* Coral — Danger, over-budget, errors */
  --accent-coral: hsl(0, 90%, 65%); /* #F06060 */
  --accent-coral-muted: hsl(0, 50%, 18%);

  /* Emerald — Success confirmations */
  --accent-emerald: hsl(155, 70%, 50%); /* #34D399 */
}
```

### Category Colors

Each default category has a fixed color that works on both themes:

| Category          | Color      | Hex       | HSL                  |
| ----------------- | ---------- | --------- | -------------------- |
| Food & Beverage   | Warm Coral | `#FF6B6B` | `hsl(0, 100%, 71%)`  |
| Transportation    | Ocean Teal | `#2DD4BF` | `hsl(172, 66%, 50%)` |
| Shopping          | Sky Blue   | `#38BDF8` | `hsl(199, 93%, 60%)` |
| Entertainment     | Lime       | `#A3E635` | `hsl(82, 77%, 55%)`  |
| Bills & Utilities | Amber      | `#FBBF24` | `hsl(45, 96%, 56%)`  |
| Travel            | Rose       | `#FB7185` | `hsl(352, 95%, 72%)` |
| Investment        | Violet     | `#A78BFA` | `hsl(258, 90%, 76%)` |
| Other             | Slate      | `#94A3B8` | `hsl(215, 20%, 65%)` |

### Gradient Tokens

```css
:root {
  /* Aurora gradient — signature brand effect */
  --gradient-aurora: linear-gradient(
    135deg,
    hsl(165, 100%, 42%) 0%,
    hsl(180, 80%, 45%) 50%,
    hsl(195, 100%, 50%) 100%
  );

  /* Subtle aurora for backgrounds (very low opacity) */
  --gradient-aurora-muted: linear-gradient(
    135deg,
    hsla(165, 100%, 42%, 0.08) 0%,
    hsla(195, 100%, 50%, 0.05) 100%
  );

  /* Glass overlay */
  --gradient-glass: linear-gradient(
    135deg,
    hsla(0, 0%, 100%, 0.03) 0%,
    hsla(0, 0%, 100%, 0.01) 100%
  );
}
```

---

## 5. Spatial System & Layout

### Spacing Scale (4px base)

```css
--space-0: 0;
--space-1: 0.25rem; /*  4px */
--space-2: 0.5rem; /*  8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
```

### Layout Principles

- **Generous negative space**: Dashboard cards have `space-6` internal padding and `space-4` gap between them. This breathability signals premium quality.
- **Asymmetric grid-breaking**: The sidebar is a fixed 260px. The main content area uses a 12-column CSS grid, but key elements intentionally break the grid — the total-spent display, for instance, spans offset columns for dramatic emphasis.
- **Depth through layering**: Background → Surface 1 → Surface 2 → Elevated. Each layer gets progressively lighter (dark mode) or has a subtle shadow lift (light mode).

### Border Radius

```css
--radius-sm: 6px; /* Buttons, badges, inputs */
--radius-md: 10px; /* Cards, dropdowns */
--radius-lg: 16px; /* Modals, sheets */
--radius-xl: 24px; /* Hero elements, onboarding cards */
--radius-full: 9999px; /* Avatars, dots */
```

### Shadows (Light Mode Only)

```css
/* Dark mode uses border-subtle instead of shadows */
--shadow-sm: 0 1px 2px hsla(222, 47%, 5%, 0.06);
--shadow-md: 0 4px 12px hsla(222, 47%, 5%, 0.08);
--shadow-lg: 0 12px 32px hsla(222, 47%, 5%, 0.12);
--shadow-glow: 0 0 20px var(--accent-primary-glow); /* Aurora glow */
```

---

## 6. Motion & Animation

### Philosophy

Motion in Aura serves one purpose: **to make the interface feel alive without making it feel busy**. Financial data changes constantly — animations help the brain track what changed.

### Library: Framer Motion (React)

Use `motion` from `framer-motion` for all React animations. CSS-only for non-React contexts (loading states, skeleton screens).

### Animation Tokens

```css
/* Durations */
--duration-fast: 150ms; /* Micro-interactions: hover, focus */
--duration-normal: 300ms; /* Transitions: open/close, fade */
--duration-slow: 500ms; /* Entrances: cards, charts */
--duration-slower: 800ms; /* Hero: total-spent counter, page load */

/* Easings */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1); /* Exits, collapses */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1); /* Symmetric transforms */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy entrances */
```

### High-Impact Animation Moments

| Moment                  | Animation                                                        | Library                              | Priority    |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------ | ----------- |
| **Dashboard load**      | Staggered card reveal (fade + slide up) with 80ms delay per card | Framer Motion                        | 🔴 Critical |
| **Total spent counter** | Count-up from 0 to actual value over 800ms                       | Framer Motion `useSpring`            | 🔴 Critical |
| **Chart draw-in**       | Donut segments animate from 0° to final arc, 500ms stagger       | Recharts `animationBegin`            | 🔴 Critical |
| **Budget bar fill**     | Bars fill from 0% to actual, with color transition at thresholds | CSS `@keyframes` + `animation-delay` | 🟡 High     |
| **New transaction**     | Brief aurora shimmer on row (teal glow pulse, 1 cycle)           | CSS `@keyframes`                     | 🟡 High     |
| **Sheet open/close**    | Slide from right + backdrop fade                                 | Framer Motion `AnimatePresence`      | 🟡 High     |
| **Toast notification**  | Slide up from bottom + fade out                                  | Framer Motion                        | 🟡 High     |
| **Hover: card**         | Subtle scale(1.01) + border-color brighten                       | CSS `transition`                     | 🟢 Normal   |
| **Hover: button**       | Background brightens + slight glow                               | CSS `transition`                     | 🟢 Normal   |
| **Focus: input**        | Border transitions to accent-primary + subtle glow               | CSS `transition`                     | 🟢 Normal   |
| **Page transition**     | Fade out/in with 150ms crossfade                                 | Next.js `loading.tsx`                | 🟢 Normal   |

### Staggered Dashboard Load (Implementation)

```tsx
// Framer Motion staggered children pattern
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <motion.div variants={cardVariants}>
    <SpendingDonut />
  </motion.div>
  <motion.div variants={cardVariants}>
    <BudgetProgress />
  </motion.div>
  <motion.div variants={cardVariants}>
    <RecentTransactions />
  </motion.div>
</motion.div>;
```

### Count-Up Animation (Total Spent)

```tsx
import { useSpring, animated } from 'framer-motion';

function AnimatedAmount({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });

  useEffect(() => {
    spring.set(value);
  }, [value]);

  return (
    <motion.span className="font-display text-3xl tabular-nums">
      {spring.get().toFixed(2)}
    </motion.span>
  );
}
```

### Aurora Shimmer (New Transaction)

```css
@keyframes aurora-shimmer {
  0% {
    box-shadow: inset 0 0 0 1px hsla(165, 100%, 50%, 0);
  }
  30% {
    box-shadow:
      inset 0 0 0 1px hsla(165, 100%, 50%, 0.3),
      0 0 20px hsla(165, 100%, 50%, 0.1);
  }
  100% {
    box-shadow: inset 0 0 0 1px hsla(165, 100%, 50%, 0);
  }
}

.transaction-new {
  animation: aurora-shimmer 1.5s ease-out forwards;
}
```

### `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Backgrounds & Atmosphere

### Dark Mode Background

The app background is NOT a flat color. It uses layered effects to create depth:

```css
.app-background-dark {
  background-color: var(--bg-primary);

  /* Subtle radial gradient in top-left — aurora glow */
  background-image:
    radial-gradient(ellipse 60% 40% at 15% 10%, hsla(165, 100%, 42%, 0.04) 0%, transparent 70%),
    radial-gradient(ellipse 40% 50% at 85% 80%, hsla(195, 100%, 50%, 0.03) 0%, transparent 60%);

  /* Noise texture overlay (SVG data URI) */
  position: relative;
}

.app-background-dark::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}
```

### Glass-Morphism Cards

Dashboard cards use a frosted glass effect:

```css
.card-glass {
  background: var(--gradient-glass);
  backdrop-filter: blur(12px) saturate(1.2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

/* Light mode: Use subtle shadow instead of glass */
:root[data-theme='light'] .card-glass {
  background: var(--bg-surface-1);
  backdrop-filter: none;
  box-shadow: var(--shadow-md);
}
```

### Sidebar Aurora Edge

The sidebar has a signature gradient border on its right edge:

```css
.sidebar::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--accent-primary) 30%,
    var(--accent-cyan) 70%,
    transparent 100%
  );
  opacity: 0.3;
}
```

---

## 8. Component Styling

### Buttons

```css
/* Primary — Aura Teal */
.btn-primary {
  background: var(--accent-primary);
  color: hsl(222, 47%, 5%); /* Dark text on bright bg */
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-sm);
  transition:
    background var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
  box-shadow: 0 0 16px var(--accent-primary-glow);
}
```

### Input Fields

```css
.input {
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  transition:
    border-color var(--duration-fast),
    box-shadow var(--duration-fast);
}

.input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-glow);
  outline: none;
}
```

### Amount Display

Dollar amounts are always mono, with specific styling:

```css
.amount {
  font-family: var(--font-mono);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  font-variant-numeric: tabular-nums;
}

.amount-positive {
  color: var(--accent-emerald);
}
.amount-negative {
  color: var(--accent-coral);
}
.amount-neutral {
  color: var(--text-primary);
}
```

### Budget Progress Bar

```css
.budget-bar {
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-3);
  overflow: visible; /* Allow overflow glow */
  position: relative;
}

.budget-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--duration-slow) var(--ease-out);
}

/* Status colors */
.budget-bar-fill[data-status='on_track'] {
  background: var(--accent-emerald);
}
.budget-bar-fill[data-status='warning'] {
  background: var(--accent-amber);
}
.budget-bar-fill[data-status='over_budget'] {
  background: var(--accent-coral);
  box-shadow: 0 0 12px hsla(0, 90%, 65%, 0.3);
}
```

### Confidence Dots

```css
.confidence-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  display: inline-block;
}

.confidence-dot[data-level='high'] {
  background: var(--accent-emerald);
}
.confidence-dot[data-level='medium'] {
  background: var(--accent-amber);
}
.confidence-dot[data-level='low'] {
  background: var(--accent-coral);
  animation: pulse-subtle 2s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

## 9. Dark & Light Mode Strategy

### Implementation

Use `next-themes` for theme management with `data-theme` attribute on `<html>`:

```tsx
// src/app/layout.tsx
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Toggle Design

The theme toggle is in the sidebar footer — a custom switch, NOT a generic toggle:

```
Dark:   [🌙 ━━━━●]   (teal accent on track)
Light:  [● ━━━━ ☀️]   (amber accent on track)
```

### Dark ↔ Light Differences

| Element       | Dark                                 | Light                             |
| ------------- | ------------------------------------ | --------------------------------- |
| Background    | Deep navy + aurora radials           | Warm parchment `#F8F6F2`          |
| Cards         | Glass-morphism (blur + transparency) | White + subtle shadow             |
| Borders       | Luminous edges (subtle opacity)      | Neutral warm gray                 |
| Text          | Cool gray spectrum                   | Warm dark spectrum                |
| Charts        | Bright, saturated colors             | Slightly desaturated for ink feel |
| Aurora glow   | Visible (teal ambient light)         | Hidden (too subtle on light bg)   |
| Noise texture | 2% opacity (adds depth)              | 0% (clean surface)                |

### Rule: Dark Mode is Default

Aura defaults to dark mode. The design system is dark-first. Light mode is a fully supported alternative, not an afterthought.

---

## 10. Iconography

### Primary: Lucide Icons

shadcn/ui uses Lucide icons by default. Stick with this for consistency.

### Rules

- **16px icons** for inline (buttons, nav, table cells)
- **20px icons** for standalone (empty states, card headers)
- **24px icons** for hero (sidebar nav items)
- Stroke width: `1.5px` (default)
- Color: `var(--text-secondary)` unless active (`var(--accent-primary)`)

### Category Emojis

Categories use native emoji (not Lucide). This is intentional — emoji adds warmth and personality that icon libraries can't match. Emoji are rendered in their native OS style.

---

## 11. Anti-Patterns (What We Avoid)

| ❌ Don't                                        | ✅ Do Instead                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| Inter, Roboto, Arial, system-ui as primary font | Instrument Serif + Syne + Outfit                                         |
| Purple gradients on white backgrounds           | Teal-cyan aurora gradients on deep navy                                  |
| Flat white cards with gray borders              | Glass-morphism with subtle aurora tint                                   |
| Uniform spacing everywhere                      | Generous whitespace with intentional density in data areas               |
| Generic toggle switches                         | Custom themed toggle with moon/sun icons                                 |
| Every element animates on hover                 | Strategic high-impact animations only (dashboard load, counters, charts) |
| Solid color backgrounds                         | Layered gradients + noise texture                                        |
| Default shadcn/ui theme colors                  | Custom CSS variables following Aurora Noir palette                       |
| Rainbow category colors with no logic           | Curated 8-color palette that works in both themes                        |
| Stock photography or illustrations              | Abstract geometric patterns inspired by aurora light                     |
| Cookie-cutter chart styling                     | Luminous chart segments with glow effects                                |
| Generic "Success!" messages                     | Personality-driven copy ("Expense logged. Your AI is learning.")         |

---

## 12. Implementation Conventions

### TypeScript `@/` Import Aliases

All imports use the `@/` path alias convention, configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Usage throughout the codebase:**

```typescript
// ✅ Always use @/ imports
import { formatSGD } from '@/lib/utils/currency';
import { SpendingDonut } from '@/components/dashboard/spending-donut';
import type { Transaction } from '@/types/transaction';

// ❌ Never use relative imports across module boundaries
import { formatSGD } from '../../../lib/utils/currency';
```

### Tailwind CSS v4 `@import` Syntax

Tailwind CSS v4 uses the CSS `@import` syntax instead of `@tailwind` directives:

```css
/* src/app/globals.css */
@import 'tailwindcss';

/* Custom theme layer */
@theme {
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-heading: 'Syne', system-ui, sans-serif;
  --font-body: 'Outfit', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --color-aura-teal: hsl(165, 100%, 42%);
  --color-aura-cyan: hsl(195, 100%, 50%);
  --color-aura-amber: hsl(38, 100%, 56%);
  --color-aura-coral: hsl(0, 90%, 65%);
}
```

### shadcn/ui Theming

Override shadcn/ui's default CSS variables with Aura design tokens:

```css
/* Map shadcn semantic tokens to Aura tokens */
@layer base {
  :root[data-theme='dark'] {
    --background: 222 47% 5%;
    --foreground: 210 20% 95%;
    --card: 222 30% 8%;
    --card-foreground: 210 20% 95%;
    --primary: 165 100% 42%;
    --primary-foreground: 222 47% 5%;
    --secondary: 222 25% 13%;
    --secondary-foreground: 210 20% 95%;
    --destructive: 0 90% 65%;
    --muted: 222 22% 18%;
    --muted-foreground: 215 15% 60%;
    --accent: 222 25% 13%;
    --accent-foreground: 210 20% 95%;
    --border: 222 20% 15%;
    --input: 222 18% 22%;
    --ring: 165 100% 42%;
    --radius: 0.625rem;
  }
}
```

### Font Loading (Next.js)

```tsx
// src/app/layout.tsx
import { Instrument_Serif, Syne, Outfit, JetBrains_Mono } from 'next/font/google';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
});
const syne = Syne({ subsets: ['latin'], variable: '--font-heading' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-body' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export default function RootLayout({ children }) {
  return (
    <html
      className={`${instrumentSerif.variable} ${syne.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body">{children}</body>
    </html>
  );
}
```

### File Naming Convention

| Type        | Convention                 | Example                |
| ----------- | -------------------------- | ---------------------- |
| Components  | kebab-case                 | `spending-donut.tsx`   |
| Utilities   | kebab-case                 | `currency.ts`          |
| Types       | kebab-case                 | `transaction.ts`       |
| CSS modules | kebab-case + `.module.css` | `dashboard.module.css` |
| Tests       | kebab-case + `.test.ts`    | `currency.test.ts`     |
| E2E         | kebab-case + `.spec.ts`    | `dashboard.spec.ts`    |
