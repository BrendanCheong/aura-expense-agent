# Aura Expense Agent — UX Decisions

> **Version:** 2.0  
> **Last Updated:** 2026-02-13  
> **Status:** Approved  
> **References:** [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md), [DESIGN.md](./DESIGN.md), [ADR-005](../ADR/ADR-005-shadcn-ui.md), [ADR-006](../ADR/ADR-006-recharts.md), [ADR-015](../ADR/ADR-015-mem0-feedback-memory.md)

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [User Personas](#2-user-personas)
3. [Core User Flows](#3-core-user-flows)
4. [Navigation & Information Architecture](#4-navigation--information-architecture)
5. [Budget UX — Salary & Percentage Allocation](#5-budget-ux--salary--percentage-allocation)
6. [Dashboard UX](#6-dashboard-ux)
7. [Transaction UX](#7-transaction-ux)
8. [Category Management UX](#8-category-management-ux)
9. [Notification & Alert UX](#9-notification--alert-ux)
10. [AI Feedback & Correction Flow](#10-ai-feedback--correction-flow)
11. [Empty & Error States](#11-empty--error-states)
12. [Responsive Design](#12-responsive-design)
13. [Accessibility](#13-accessibility)

---

## 1. Design Principles

| Principle                  | Description                                                     | Example                                             |
| -------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| **Zero-Touch**             | The system works without user intervention for 90%+ of expenses | Bank email → auto-categorized in dashboard          |
| **Glanceable**             | Critical info visible in < 3 seconds                            | Budget progress bars show % at a glance             |
| **Progressive Disclosure** | Show summary first, details on demand                           | Dashboard → click category → drilldown              |
| **Forgiveness**            | Every user action is reversible                                 | Undo re-categorization, restore deleted transaction |
| **Minimal Input**          | Forms pre-fill where possible, dropdowns over free text         | Manual transaction → vendor autocomplete from cache |

---

## 2. User Personas

### Primary: **Sarah — Working Professional (Singapore)**

| Attribute  | Detail                                                        |
| ---------- | ------------------------------------------------------------- |
| Age        | 28                                                            |
| Income     | SGD $5,000/month                                              |
| Bank       | UOB / DBS                                                     |
| Pain Point | Spends 2 hours/month categorizing expenses in spreadsheets    |
| Goal       | "I want to know where my money goes without lifting a finger" |
| Devices    | iPhone 15 (primary), MacBook Pro (secondary)                  |

### Secondary: **James — Freelance Developer (Singapore)**

| Attribute  | Detail                                               |
| ---------- | ---------------------------------------------------- |
| Age        | 32                                                   |
| Income     | Variable, ~SGD $7,000/month                          |
| Bank       | OCBC                                                 |
| Pain Point | No separation between personal and business expenses |
| Goal       | "I want custom categories for business deductions"   |
| Devices    | Android (primary), ThinkPad (secondary)              |

---

## 3. Core User Flows

### Flow 1: First-Time Setup

```
Login (OAuth) → Onboarding Modal → Set Monthly Salary (optional)
     → Allocate Budget % Per Category → Dashboard (empty state)
```

**User Story:** US-6 (OAuth login)  
**Decision:** Onboarding is a single modal, not a multi-step wizard. Users can skip and set budgets later. Reducing friction > completeness at signup.

### Flow 2: Automated Expense Capture (Zero-Touch)

```
Bank sends email → Auto-forwarded to Resend → Agent processes
     → Transaction appears in dashboard → Budget progress updates
```

**User Story:** US-1, US-2  
**Decision:** No user action required. If agent confidence is "low", a subtle indicator (🟡) appears next to the transaction so the user can correct it.

### Flow 3: Manual Expense Entry

```
Click "+" → Quick Add Sheet slides up from bottom
     → Type vendor (autocomplete from cache) → Amount (numeric keypad)
     → Category (dropdown, pre-selected from vendor cache) → Date (defaults today)
     → Submit
```

**User Story:** Implied from US-3  
**Decision:** Sheet (half-modal) instead of full page navigate. Vendor autocomplete reduces typing. Category pre-selected if vendor is known.

### Flow 4: Budget Review & Adjustment

```
Navigate to /budgets → See all categories with progress bars
     → Edit budget amount inline → Or: Use salary allocation view
```

**User Story:** US-3, US-5  
**Decision:** Two modes: (a) direct amount entry per category, (b) salary-based percentage allocation. See [Section 5](#5-budget-ux--salary--percentage-allocation).

### Flow 5: Re-Categorize Transaction

```
Click transaction row → Sheet opens → Change category dropdown
     → Vendor cache automatically updated → Dashboard refreshes
```

**User Story:** US-2  
**Decision:** Changing a transaction's category updates the vendor cache so future transactions from the same vendor are auto-categorized correctly. This is a learning mechanism.

---

## 4. Navigation & Information Architecture

### Sidebar (Desktop)

```
┌──────────────┐
│  🌀 Aura     │
│              │
│  📊 Dashboard│  ← Default landing page
│  📋 Transact.│  ← Full history + filters
│  🏷️ Categor. │  ← CRUD categories
│  💰 Budgets  │  ← Monthly budgets
│  ⚙️ Settings │  ← Email setup, profile
│              │
│  ┌──────────┐│
│  │ 👤 Sarah ││  ← Avatar + name
│  │ Sign Out ││
│  └──────────┘│
└──────────────┘
```

### Mobile (Bottom Tab Bar)

```
┌──────┬──────┬──────┬──────┬──────┐
│  📊  │  📋  │  ➕  │  💰  │  ⚙️  │
│ Dash │ Trans│ Add  │ Budg │ More │
└──────┴──────┴──────┴──────┴──────┘
```

**Decision:** The "+" button is centered and prominent in mobile nav — manual entry should be effortless. Categories are nested under "More" on mobile since they're infrequently accessed.

---

## 5. Budget UX — Salary & Percentage Allocation

### Problem

Users think in terms of their monthly salary, not absolute dollar amounts per category. "I earn $5,000 — I want to spend 20% on food."

### Solution: Dual-Mode Budget Setting

#### Mode A: Direct Amount (Default)

```
┌──────────────────────────────────────────────────────────┐
│  Budgets — February 2026                    [% Allocate] │
│                                                          │
│  ┌────────────────┬──────────┬────────────────────────┐  │
│  │ Category       │ Budget   │ Progress               │  │
│  ├────────────────┼──────────┼────────────────────────┤  │
│  │ 🍔 Food        │ [$400  ] │ ████████░░░░ $188/$400 │  │
│  │ 🚗 Transport   │ [$150  ] │ ████░░░░░░░░ $78/$150  │  │
│  │ 🛍️ Shopping    │ [$300  ] │ ████████████ $327/$300 │  │
│  │ 🎬 Entertain.  │ [$100  ] │ ████████░░░░ $83/$100  │  │
│  │ 💡 Bills       │ [$500  ] │ ████████░░░░ $359/$500 │  │
│  │ ✈️ Travel      │ [$400  ] │ ████████████ $372/$400 │  │
│  │ 📦 Other       │ [$50   ] │ ██░░░░░░░░░░ $10/$50   │  │
│  └────────────────┴──────────┴────────────────────────┘  │
│                              Total: $1,900               │
└──────────────────────────────────────────────────────────┘
```

**Behavior:**

- Inline editable number inputs
- Tab through categories to quickly set all
- Total shown at bottom (informational, not enforced)
- Budget amounts saved per category per month (can differ month-to-month)

#### Mode B: Salary Percentage Allocation

Activated by clicking `[% Allocate]` button:

```
┌──────────────────────────────────────────────────────────┐
│  Budget Allocation — February 2026       [$ Direct Mode] │
│                                                          │
│  Monthly Salary:  [$5,000     ]                          │
│                                                          │
│  ┌────────────────┬──────────┬──────────┬────────────┐   │
│  │ Category       │ %        │ Amount   │ Spent      │   │
│  ├────────────────┼──────────┼──────────┼────────────┤   │
│  │ 🍔 Food        │ [  8% ]  │ $400     │ $188 (47%) │   │
│  │ 🚗 Transport   │ [  3% ]  │ $150     │ $78  (52%) │   │
│  │ 🛍️ Shopping    │ [  6% ]  │ $300     │ $327 (109%)│   │
│  │ 🎬 Entertain.  │ [  2% ]  │ $100     │ $83  (83%) │   │
│  │ 💡 Bills       │ [ 10% ]  │ $500     │ $359 (72%) │   │
│  │ ✈️ Travel      │ [  8% ]  │ $400     │ $372 (93%) │   │
│  │ 📦 Other       │ [  1% ]  │ $50      │ $10  (20%) │   │
│  ├────────────────┼──────────┼──────────┼────────────┤   │
│  │ 💾 Savings     │   62%    │ $3,100   │     —      │   │
│  └────────────────┴──────────┴──────────┴────────────┘   │
│                                                          │
│  Allocated: 38% ($1,900)  │  Unallocated: 62% ($3,100)  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ │    │
│  │  38% allocated                    62% savings    │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│                                     [Apply Allocation]   │
└──────────────────────────────────────────────────────────┘
```

**Behavior:**

- User enters monthly salary at top
- Percentages are editable per category
- Dollar amounts auto-calculate: `salary × percentage`
- Unallocated remainder shown as "Savings" (informational)
- Allocation bar shows visual split
- "Apply Allocation" converts percentages to dollar budgets
- Salary is stored in user profile (reused next month)
- Percentages do NOT need to sum to 100% — unallocated is savings
- Each month can have different budgets (not locked to salary %)

### Data Model Impact

```typescript
// users table — add salary field
interface UserProfile {
  // ... existing fields
  monthly_salary: number | null; // e.g., 5000.00
  budget_mode: 'direct' | 'percentage'; // last used mode
}

// budgets table — no change needed
// Amount is always stored as absolute $ (derived from % × salary if applicable)
```

**Decision:** Store absolute amounts, not percentages. This ensures budgets remain valid even if salary changes. The percentage mode is a **UI convenience**, not a data model concern.

---

## 6. Dashboard UX

### Time Range Selector

**Decision:** Three preset ranges — Week, Month, Year — with Month as default. No custom range picker in V1 (80/20 rule).

| Range | Data Shown                               |
| ----- | ---------------------------------------- |
| Week  | Current ISO week (Mon-Sun), SGT timezone |
| Month | Current calendar month (default)         |
| Year  | Current calendar year                    |

**Interaction:** Tabs (not dropdown). Active tab is visually highlighted. Clicking a tab re-fetches dashboard data.

### Donut Chart Decisions

| Decision        | Rationale                                                    |
| --------------- | ------------------------------------------------------------ |
| Donut (not pie) | Center label shows total spent — more useful than a full pie |
| Max 7 segments  | Matches max categories. No "Others" aggregation needed       |
| Color coding    | Each category has a fixed color across all views             |
| Click-to-filter | Clicking a donut segment filters the transaction table below |

### Budget Progress Bar Decisions

| Decision             | Rationale                                                |
| -------------------- | -------------------------------------------------------- |
| Horizontal bars      | Easier to compare across categories than circular gauges |
| Color thresholds     | Green (< 80%), Amber (80-99%), Red (≥ 100%)              |
| Show "$X of $Y"      | Dollar amount more useful than bare percentage           |
| Over-budget overflow | Bar extends past 100% with red overflow section          |

---

## 7. Transaction UX

### Table vs. Card View

**Decision:** Table on desktop, card list on mobile. Both show the same data:

```
Desktop Table Row:     Date | Vendor | Category [badge] | Amount | Confidence [dot]
Mobile Card:           Vendor          $16.23
                       Date · Category · 🟢
```

### Confidence Indicator

| Icon         | Meaning           | Trigger                          |
| ------------ | ----------------- | -------------------------------- |
| 🟢 Green dot | High confidence   | Vendor cache hit or manual entry |
| 🟡 Amber dot | Medium confidence | LLM matched to category          |
| 🔴 Red dot   | Low confidence    | Fallback to "Other"              |

**Decision:** Dots (not text labels) to save space. Tooltip on hover explains the level. Low-confidence transactions subtly highlight to encourage user correction.

### Transaction Sheet (Half-Modal)

When a user clicks a transaction row, a sheet slides in from the right (desktop) or bottom (mobile):

```
┌──────────────────────────────────────┐
│  Transaction Details           [✕]   │
│                                      │
│  Vendor:    [DIGITALOCEAN.COM    ]   │  ← Editable
│  Amount:    [$16.23              ]   │  ← Editable
│  Date:      [08 Feb 2026     📅 ]   │  ← Editable
│  Notes:     [Cloud hosting       ]   │  ← Editable (optional)
│  Source:    📧 Email (UOB)           │
│  Category:  [Bills & Utilities  ▾]   │  ← Editable dropdown
│  Confidence: 🟡 Medium              │
│                                      │
│  ─────────────────────────────       │
│  Original Email Subject:             │
│  "Your UOB Card was charged $16.23"  │
│                                      │
│  [💬 Give AI Feedback]     [Save]    │
│  [🗑️ Delete Transaction]             │
└──────────────────────────────────────┘
```

**Decisions:**

- Sheet (not full page) keeps the transaction list visible behind the overlay
- All fields are editable inline (vendor, amount, date, notes, category)
- Changing the category dropdown saves immediately + updates vendor cache
- "Give AI Feedback" button opens the conversational feedback flow (see [Section 10](#10-ai-feedback--correction-flow))
- "Save" commits edits to vendor, amount, date, or notes
- "Delete Transaction" has a confirmation dialog + undo toast (8s)

### Quick Add Sheet

Click "+" to add a manual transaction:

```
┌──────────────────────────────────────┐
│  Add Transaction               [✕]   │
│                                      │
│  Vendor:    [                    ]   │  ← Autocomplete from cache
│  Amount:    [                    ]   │  ← Numeric keypad on mobile
│  Category:  [Select category    ▾]   │  ← Pre-selected if vendor known
│  Date:      [13 Feb 2026     📅 ]   │  ← Defaults to today
│  Notes:     [                    ]   │  ← Optional
│                                      │
│              [Cancel] [Add Expense]   │
└──────────────────────────────────────┘
```

**Decisions:**

- Vendor field has autocomplete from vendor cache — type "GR" and see "GRAB *GRABFOOD", "GRAB *RIDE"
- If a known vendor is selected, category auto-fills from vendor cache
- Date defaults to today (SGT)
- Source is always "manual", confidence is always "high"
- Sheet slides up from bottom (mobile) or in from right (desktop)

---

## 8. Category Management UX

### Default Categories (Cannot Delete "Other")

The system creates 8 default categories per user. "Other" is the system fallback and cannot be deleted.

| Category          | Emoji | Color     | Description (Fed to Agent)                           |
| ----------------- | ----- | --------- | ---------------------------------------------------- |
| Food & Beverage   | 🍔    | `#FF6B6B` | Restaurants, groceries, food delivery, cafes, hawker |
| Transport         | 🚗    | `#2DD4BF` | Grab, taxi, MRT, bus, parking, fuel                  |
| Shopping          | 🛍️    | `#38BDF8` | E-commerce, retail stores, fashion, electronics      |
| Entertainment     | 🎬    | `#A3E635` | Movies, streaming, games, concerts, books            |
| Bills & Utilities | 💡    | `#FBBF24` | Phone, internet, electricity, water, insurance       |
| Travel            | ✈️    | `#FB7185` | Flights, hotels, attractions, travel insurance       |
| Investment        | 📈    | `#A78BFA` | Stocks, crypto, ETFs, robo-advisors, fixed deposits  |
| Other             | 📦    | `#94A3B8` | Uncategorized or miscellaneous                       |

**Decision:** Emoji + color is set per category to ensure visual consistency in charts and badges. Users can create custom categories with their own emoji and color.

### Adding a Custom Category

```
┌─────────────────────────────────────────┐
│  Add Category                    [✕]    │
│                                         │
│  Name:        [Subscriptions        ]   │
│  Emoji:       [🔄] (picker)            │
│  Color:       [■ #6C5CE7] (picker)     │
│  Description: [Monthly recurring        │
│               services like Netflix,    │
│               Spotify, cloud hosting ]  │
│                                         │
│  ℹ️ The description helps the AI agent   │
│  categorize transactions correctly.     │
│                                         │
│              [Cancel] [Create Category] │
└─────────────────────────────────────────┘
```

**Decision:** Description field is prominent with a hint explaining its purpose. The agent uses category descriptions to improve categorization accuracy.

---

## 9. Notification & Alert UX

### Budget Alert Banner

Shown at the top of the dashboard when any category exceeds thresholds:

```
⚠️ Shopping is $27.19 over budget · Entertainment at 83% of budget     [Dismiss]
```

**Decisions:**

- Banner is orange for warnings (80-99%), red for over-budget (≥100%)
- Shows the most critical category first (over-budget before warning)
- "Dismiss" hides banner until next page visit (not persisted)
- Maximum 3 categories shown; if more, "+N more" with expand link

### Toast Notifications

| Event                      | Toast Message                                                                   | Duration       |
| -------------------------- | ------------------------------------------------------------------------------- | -------------- |
| Expense auto-logged        | "New expense: $16.23 at DIGITALOCEAN.COM"                                       | 5s             |
| Manual expense added       | "Expense added successfully"                                                    | 3s             |
| Transaction updated        | "Transaction updated."                                                          | 3s             |
| Category changed           | "Category updated. Future VENDOR transactions will be categorized as CATEGORY." | 5s             |
| Transaction deleted        | "Transaction deleted. [Undo]"                                                   | 8s (with undo) |
| Budget exceeded            | "⚠️ Shopping budget exceeded!"                                                  | 8s             |
| Feedback approved          | "Category updated. I'll remember this for next time."                           | 5s             |
| Feedback rejected (refine) | "Got it — tell me more so I can get it right."                                  | 3s             |

**Decision:** Undo action available for 8 seconds after deletion. This is the primary "forgiveness" mechanism.

---

## 10. AI Feedback & Correction Flow

### Problem

When the AI agent mis-categorizes a transaction, users need a way to correct it AND teach the agent their preferences so it doesn't repeat the mistake. A simple category dropdown fixes the immediate issue but doesn't create a learning loop.

### Solution: Conversational Feedback Sheet

The feedback flow is a lightweight conversation between the user and the AI agent, embedded within the transaction detail sheet. It uses **Mem0** for long-term semantic memory ([ADR-015](../ADR/ADR-015-mem0-feedback-memory.md)).

### Flow

```
User clicks "Give AI Feedback" on transaction
    → Feedback Sheet opens
    → User types: "DigitalOcean is my cloud server hosting"
    → Agent processes feedback
    → Agent responds: "I'll put DIGITALOCEAN.COM under Bills
       & Utilities — it's a cloud hosting subscription."
    → [Approve] or [Reject & Refine]
    → Approve: Transaction moves + vendor cache updated
       + feedback stored in Mem0
    → Agent remembers for ALL future DigitalOcean transactions
```

### Feedback Sheet Wireframe

```
┌──────────────────────────────────────────┐
│  Correct This Transaction          [✕]   │
│                                          │
│  DIGITALOCEAN.COM                $16.23  │
│  08 Feb 2026 · Other · 🔴 Low           │
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│  What should the category be?            │
│  ┌──────────────────────────────────┐    │
│  │ DigitalOcean is my cloud server  │    │
│  │ hosting. It should be Bills &    │    │
│  │ Utilities, not Other.            │    │
│  └──────────────────────────────────┘    │
│                                          │
│                         [Send to AI →]   │
│                                          │
│  ─── AI Response ────────────────────    │
│                                          │
│  🤖 "I'll categorize DIGITALOCEAN.COM   │
│  as **Bills & Utilities** because it's   │
│  a cloud infrastructure subscription.    │
│  I'll remember this for all future       │
│  transactions from this vendor."         │
│                                          │
│  [✅ Approve]    [🔄 Reject & Refine]   │
│                                          │
└──────────────────────────────────────────┘
```

### Interaction Rules

| Rule           | Detail                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Max rounds     | 3 reject/refine loops before fallback to manual dropdown                       |
| Loading state  | "Thinking..." with aurora shimmer animation while agent processes              |
| Approve action | Transaction re-categorized + vendor cache updated + Mem0 memory stored         |
| Reject action  | Feedback box reappears pre-filled with previous text                           |
| Timeout        | 15 seconds per agent response, then show "Agent took too long — pick manually" |
| Offline        | Just show the category dropdown, hide feedback option                          |

### Two Correction Paths

| Path                              | When                                           | What Happens                                              |
| --------------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| **Quick fix** (category dropdown) | User knows the right category, doesn't need AI | Dropdown change → vendor cache updated. No Mem0, no AI.   |
| **AI feedback** (conversation)    | User wants AI to learn nuanced preferences     | Feedback → Agent → Approve → vendor cache + Mem0 updated. |

**Decision:** Both paths coexist. The dropdown is always visible for speed. The feedback button is for users who want the AI to truly learn. Neither path blocks the other.

### Memory Impact

After feedback is approved, the 5-tier categorization chain applies to future transactions:

```
Tier 1: Vendor Cache (exact match)       → confidence: "high"
Tier 2: Mem0 Memory (semantic recall)     → confidence: "high"
Tier 3: LLM Category Match               → confidence: "medium"
Tier 4: Brave Search (web lookup)         → confidence: "medium"
Tier 5: Fallback to "Other"              → confidence: "low"
```

Mem0 enables nuanced rules that vendor cache can't express. For example:

- "All cloud/hosting services should be under Bills" (not just DIGITALOCEAN.COM)
- "Grab rides after 10pm are usually from nights out — Entertainment, not Transport"

---

## 11. Empty & Error States

### Dashboard — No Transactions

```
┌──────────────────────────────────────┐
│                                      │
│        📭                            │
│                                      │
│   No expenses yet this month         │
│                                      │
│   Set up email forwarding to start   │
│   tracking automatically.            │
│                                      │
│   [Set Up Email] [Add Manually]      │
│                                      │
└──────────────────────────────────────┘
```

### Transactions — No Results

```
No transactions match your filters.
[Clear Filters]
```

### Budget — No Budget Set

```
Set your monthly budgets to start tracking spending.
[Set Up Budgets] or [Use Salary Allocation]
```

### Error State — API Failure

```
┌──────────────────────────────────────┐
│                                      │
│        ⚠️                            │
│                                      │
│   Something went wrong               │
│   Failed to load dashboard data.     │
│                                      │
│   [Try Again]                        │
│                                      │
└──────────────────────────────────────┘
```

**Decision:** All empty states include a primary CTA to guide the user. Error states show a "Try Again" button, not a reload.

---

## 12. Responsive Design

### Breakpoints

| Name    | Width      | Layout                               |
| ------- | ---------- | ------------------------------------ |
| Mobile  | < 640px    | Single column, bottom nav, card list |
| Tablet  | 640-1024px | Collapsible sidebar, 2-column grid   |
| Desktop | > 1024px   | Fixed sidebar, 3-column dashboard    |

### Key Responsive Decisions

| Component          | Mobile                      | Desktop                       |
| ------------------ | --------------------------- | ----------------------------- |
| Navigation         | Bottom tab bar (5 tabs)     | Left sidebar                  |
| Transaction list   | Card list (swipe to delete) | Data table                    |
| Donut chart        | Full width, legend below    | Side by side with budget bars |
| Budget bars        | Stacked vertically          | 2-column grid                 |
| Transaction detail | Bottom sheet (full height)  | Right sheet (400px wide)      |
| Manual add         | Bottom sheet                | Right sheet                   |

---

## 13. Accessibility

| Requirement      | Implementation                                                    |
| ---------------- | ----------------------------------------------------------------- |
| Color contrast   | WCAG AA minimum (4.5:1 for text)                                  |
| Focus management | Visible focus rings on all interactive elements                   |
| Screen reader    | ARIA labels on charts, badges, icons                              |
| Keyboard nav     | Tab through all controls, Enter to submit, Escape to close sheets |
| Motion           | `prefers-reduced-motion` disables chart animations                |
| Font size        | Base 16px, scales with user preference                            |

**Decision:** Chart data always has a text alternative (table below chart or tooltip). Color is never the sole indicator — dots also have tooltips, bars show numeric values.
