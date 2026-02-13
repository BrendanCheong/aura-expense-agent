# Aura Expense Agent — Frontend Architecture

> **Framework:** Next.js 19 (App Router, Server Components)  
> **UI Library:** shadcn/ui (Tailwind CSS v4 under the hood)  
> **Charts:** Recharts (via shadcn/ui `chart` component)  
> **Animations:** Framer Motion (stagger, count-up, sheet transitions)  
> **Theme:** next-themes (dark/light mode)  
> **Design System:** See [DESIGN.md](./DESIGN.md) for the full "Aurora Noir" visual language  
> **State:** React Server Components + client hooks for mutations  
> **Imports:** All TypeScript imports use `@/` path alias (`"@/*": ["./src/*"]`)

---

## 📐 Page Layout & Routing

```
/ (Landing Page)
├── (auth)/
│   ├── login                → OAuth2 sign-in (Google + GitHub)
│   └── callback             → OAuth2 redirect handler
├── (dashboard)/             → Authenticated layout with sidebar
│   ├── /                    → Dashboard (charts + recent transactions)
│   ├── /transactions        → Full transaction history table
│   ├── /categories          → Manage expense categories
│   ├── /budgets             → Set per-category monthly budgets
│   └── /settings            → Profile + inbound email address
```

---

## 🖼️ Wireframes

### Dashboard Page (`/`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────────────────────────────────────────────────┐  │
│  │          │  │  ⚠️ BUDGET ALERT BANNER                              │  │
│  │          │  │  Shopping is $27.19 over budget · Entertainment at   │  │
│  │  SIDEBAR │  │  83% of budget                              [Dismiss]│  │
│  │          │  ├──────────────────────────────────────────────────────┤  │
│  │  📊 Dash │  │                                                      │  │
│  │  📋 Trans│  │  February 2026          [Week ▾] [Month ▾] [Year ▾] │  │
│  │  🏷️ Cats │  │                                                      │  │
│  │  💰 Budg │  │  ┌──────────────────┐  ┌──────────────────────────┐ │  │
│  │  ⚙️ Sett │  │  │                  │  │  BUDGET PROGRESS BARS    │ │  │
│  │          │  │  │   DONUT CHART    │  │                          │ │  │
│  │          │  │  │                  │  │  🍔 Food:  ████████░░ 47%│ │  │
│  │          │  │  │  Total: $1,023   │  │  🚗 Trans: █████░░░░ 52%│ │  │
│  │          │  │  │                  │  │  🛍️ Shop:  █████████▓109%│ │  │
│  │          │  │  │  🍔 18%  🚗 8%   │  │  🎬 Ent:   ████████░ 83%│ │  │
│  │          │  │  │  🛍️ 25% 💡 20%  │  │  💡 Bills: ███████░░ 72%│ │  │
│  │          │  │  │  ✈️ 19% 🎬 5%   │  │  ✈️ Travel: ████░░░░░ 93%│ │  │
│  │          │  │  │                  │  │  � Invest:████████░ 88%│ │  │
│  │          │  │  │                  │  │  �📦 Other: ██░░░░░░░ 20%│ │  │
│  │          │  │  └──────────────────┘  └──────────────────────────┘ │  │
│  │          │  │                                                      │  │
│  │          │  │  RECENT TRANSACTIONS                                 │  │
│  │          │  │  ┌──────────────────────────────────────────────────┐│  │
│  │          │  │  │ Date       │ Vendor          │ Category  │ Amount││  │
│  │          │  │  │───────────│─────────────────│───────────│───────││  │
│  │          │  │  │ 08 Feb    │ DIGITALOCEAN    │ 💡 Bills  │ $16.23││  │
│  │          │  │  │ 08 Feb    │ AMAZON.SG       │ 🛍️ Shop  │ $89.99││  │
│  │          │  │  │ 07 Feb    │ SINGTEL MOBILE  │ 💡 Bills  │ $48.00││  │
│  │          │  │  │ 06 Feb    │ GOLDEN VILLAGE  │ 🎬 Ent   │ $13.50││  │
│  │          │  │  │ 05 Feb    │ STARBUCKS       │ 🍔 Food  │ $8.90 ││  │
│  │          │  │  └──────────────────────────────────────────────────┘│  │
│  │          │  │                              [View All Transactions →]│  │
│  └──────────┘  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Transactions Page (`/transactions`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  Transactions                          [+ Add Transaction]   │
│          │                                                               │
│          │  Filters: [All Categories ▾] [Date Range 📅] [Source ▾]      │
│          │                                                               │
│          │  ┌────────────────────────────────────────────────────────┐   │
│          │  │ Date       │ Vendor          │ Category  │ Amount│ ⚡  │   │
│          │  │───────────│─────────────────│───────────│───────│────│   │
│          │  │ 08 Feb    │ DIGITALOCEAN    │ 💡 Bills  │$16.23│ 🟡 │   │
│          │  │ 08 Feb    │ AMAZON.SG       │ 🛍️ Shop  │$89.99│ 🟢 │   │
│          │  │ ...       │ ...             │ ...       │ ...  │ ...│   │
│          │  └────────────────────────────────────────────────────────┘   │
│          │                                                               │
│          │  Showing 1–25 of 30        [← Prev] [1] [2] [Next →]        │
│          │                                                               │
│          │  ⚡ Confidence: 🟢 High  🟡 Medium  🔴 Low                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Categories Page (`/categories`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  Categories                             [+ New Category]     │
│          │                                                               │
│          │  ┌──────────────────────────────────────────────────────┐     │
│          │  │ 🍔  Food & Beverage                          [Edit]  │     │
│          │  │     Restaurants, cafes, hawker centres, food delivery │     │
│          │  │     #ef4444 ████  │  Transactions: 7  │  Budget: $400│     │
│          │  ├──────────────────────────────────────────────────────┤     │
│          │  │ 🚗  Transportation                           [Edit]  │     │
│          │  │     Public transit, ride-hailing, fuel, parking       │     │
│          │  │     #f97316 ████  │  Transactions: 5  │  Budget: $150│     │
│          │  ├──────────────────────────────────────────────────────┤     │
│          │  │ ...                                                   │     │
│          │  └──────────────────────────────────────────────────────┘     │
│          │                                                               │
│          │  ⚠️ Deleting a category will move its transactions to "Other" │
└──────────────────────────────────────────────────────────────────────────┘
```

### Budgets Page (`/budgets`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  Monthly Budget — February 2026    [◀ Jan] [Mar ▶]          │
│          │                                                               │
│          │  Total Budget: $1,900.00 │ Spent: $1,023.49 │ Left: $876.51  │
│          │  ════════════════════████████████████░░░░░░░ 53.9%            │
│          │                                                               │
│          │  ┌─────────────┬──────────┬──────────┬────────┬──────────┐   │
│          │  │ Category    │ Budget   │ Spent    │ Left   │ Status   │   │
│          │  │─────────────│──────────│──────────│────────│──────────│   │
│          │  │ 🍔 Food     │ $400.00  │ $188.30  │$211.70 │ ✅ 47%   │   │
│          │  │ 🚗 Transport│ $150.00  │ $78.30   │ $71.70 │ ✅ 52%   │   │
│          │  │ 🛍️ Shopping │ $300.00  │ $327.19  │ -$27.19│ 🔴 109%  │   │
│          │  │ 🎬 Entertain│ $100.00  │ $83.47   │ $16.53 │ ⚠️ 83%   │   │
│          │  │ 💡 Bills    │ $500.00  │ $370.33  │$129.67 │ ✅ 74%   │   │
│          │  │ ✈️ Travel   │ $400.00  │ $370.00  │ $30.00 │ ⚠️ 93%   │   │
│          │  │ 📈 Invest   │ $800.00  │ $700.00  │$100.00 │ ⚠️ 88%   │   │
│          │  │ 📦 Other    │ $50.00   │ $10.00   │ $40.00 │ ✅ 20%   │   │
│          │  └─────────────┴──────────┴──────────┴────────┴──────────┘   │
│          │                                                               │
│          │  Click any row to edit the budget amount                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Settings Page (`/settings`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  Settings                                                    │
│          │                                                               │
│          │  Profile                                                      │
│          │  ┌──────────────────────────────────────────────────────┐     │
│          │  │  Name:  Brendan                                      │     │
│          │  │  Email: brendan@gmail.com                             │     │
│          │  │  Auth:  Google OAuth                                  │     │
│          │  └──────────────────────────────────────────────────────┘     │
│          │                                                               │
│          │  Email Forwarding Setup                                       │
│          │  ┌──────────────────────────────────────────────────────┐     │
│          │  │  Your unique Aura email address:                     │     │
│          │  │  ┌──────────────────────────────────────────┐        │     │
│          │  │  │ user-abc@inbound.yourdomain.com    [Copy]│        │     │
│          │  │  └──────────────────────────────────────────┘        │     │
│          │  │                                                      │     │
│          │  │  📝 Setup Instructions:                              │     │
│          │  │  1. Open Gmail → Settings → Filters                  │     │
│          │  │  2. Create filter: has words "receipt OR invoice      │     │
│          │  │     OR transaction OR payment"                       │     │
│          │  │  3. Action: Forward to the address above             │     │
│          │  │  4. Done! Aura will auto-process your expenses.      │     │
│          │  └──────────────────────────────────────────────────────┘     │
│          │                                                               │
│          │  [Sign Out]                                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Tree

```
src/components/
├── ui/                           ← shadcn/ui primitives (auto-generated)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── progress.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sheet.tsx                  ← Mobile sidebar
│   ├── skeleton.tsx               ← Loading states
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   ├── toaster.tsx
│   └── chart.tsx                  ← Recharts wrapper from shadcn
│
├── charts/
│   ├── spending-donut.tsx         ← Donut chart: spending by category
│   │   Props: { data: CategorySpending[], total: number }
│   │   Uses: Recharts PieChart + shadcn ChartContainer
│   │
│   ├── budget-progress.tsx        ← Stacked progress bars per category
│   │   Props: { budgets: BudgetWithSpending[] }
│   │   Uses: shadcn Progress + conditional coloring
│   │
│   ├── daily-spending-bar.tsx     ← Bar chart: daily spending over time
│   │   Props: { data: DailySpending[] }
│   │   Uses: Recharts BarChart
│   │
│   └── total-budget-bar.tsx       ← Single progress bar for total budget
│       Props: { total: number, spent: number }
│
├── tables/
│   ├── transactions-table.tsx     ← Full data table with pagination
│   │   Props: { transactions, page, total, onPageChange }
│   │   Features: sortable columns, category badge, confidence indicator
│   │
│   └── recent-transactions.tsx    ← Compact table for dashboard (last 5–10)
│       Props: { transactions: Transaction[] }
│
├── forms/
│   ├── transaction-form.tsx       ← Create/edit manual transaction
│   │   Uses: shadcn Dialog + Form + Select (category picker)
│   │
│   ├── category-form.tsx          ← Create/edit category
│   │   Fields: name, description, icon (emoji picker), color (color picker)
│   │
│   └── budget-form.tsx            ← Inline edit budget amount
│       Uses: shadcn Input with inline save
│
├── feedback/
│   ├── feedback-sheet.tsx         ← AI feedback correction sheet (slides in from right)
│   │   Props: { transactionId, vendor, currentCategory, onComplete }
│   │   Features: text input, AI response bubble, approve/reject buttons, max 3 rounds
│   │   See: [FEAT-013](../features/FEAT-013-ai-feedback.md)
│   │
│   └── feedback-conversation.tsx  ← Conversation UI within feedback sheet
│       Props: { messages: Array<{role: 'user'|'ai', content: string}>, isLoading }
│       Uses: Framer Motion for message stagger animation
│
├── alerts/
│   └── budget-alert-banner.tsx    ← Dismissible alert banner at top of dashboard
│       Props: { alerts: BudgetAlert[] }
│       Behavior:
│         - Yellow/amber for "warning" (80%+ spent)
│         - Red for "over_budget" (100%+ spent)
│         - Shows category name + specific amount over budget
│         - Dismissible per session (state in localStorage)
│
├── layout/
│   ├── sidebar.tsx                ← Collapsible navigation sidebar
│   │   Items: Dashboard, Transactions, Categories, Budgets, Settings
│   │   Uses: shadcn Sheet for mobile, static for desktop
│   │
│   ├── header.tsx                 ← Top bar with user avatar + sign out
│   │   Features: breadcrumb, mobile menu toggle
│   │
│   └── time-range-selector.tsx    ← Week / Month / Year toggle
│       Props: { value: 'week' | 'month' | 'year', onChange }
│       Uses: shadcn Tabs or ToggleGroup
│
└── shared/
    ├── category-badge.tsx         ← Colored badge: "🍔 Food & Beverage"
    │   Props: { category: Category }
    │
    ├── confidence-indicator.tsx   ← 🟢 🟡 🔴 dot based on confidence
    │   Props: { confidence: 'high' | 'medium' | 'low' }
    │
    ├── currency-display.tsx       ← Formatted SGD amount: "$1,023.49"
    │   Props: { amount: number }
    │
    ├── empty-state.tsx            ← "No transactions yet" illustration
    │   Props: { title, description, action? }
    │
    └── loading-skeleton.tsx       ← Skeleton loaders for each page section
```

---

## 🎨 Design System

### Color Palette

| Purpose | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | Zinc 950 | `#09090b` | Dark mode background |
| Card | Zinc 900 | `#18181b` | Card surfaces |
| Border | Zinc 800 | `#27272a` | Dividers, borders |
| Text Primary | Zinc 50 | `#fafafa` | Main text |
| Text Secondary | Zinc 400 | `#a1a1aa` | Muted text |
| Accent | Indigo 500 | `#6366f1` | Primary actions |
| Success | Green 500 | `#22c55e` | On track / under budget |
| Warning | Amber 500 | `#f59e0b` | Approaching budget |
| Danger | Red 500 | `#ef4444` | Over budget |

### Typography (via Tailwind)

| Element | Class |
|---------|-------|
| Page Title | `text-2xl font-bold tracking-tight` |
| Section Header | `text-lg font-semibold` |
| Card Title | `text-sm font-medium` |
| Body | `text-sm text-muted-foreground` |
| Amount (large) | `text-3xl font-bold tabular-nums` |
| Amount (table) | `text-sm font-medium tabular-nums` |

### Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| < 640px (mobile) | Sidebar collapses to sheet/drawer. Charts stack vertically. Table scrolls horizontally. |
| 640–1024px (tablet) | Sidebar as overlay. Charts in 1-column grid. |
| > 1024px (desktop) | Sidebar permanently visible. Charts in 2-column grid. |

---

## 📊 Recharts Integration

### Spending Donut Chart

```typescript
// src/components/charts/spending-donut.tsx

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategorySpending {
  name: string;
  value: number;    // amount spent
  color: string;    // hex color from category
  icon: string;     // emoji
  percentage: number;
}

interface SpendingDonutProps {
  data: CategorySpending[];
  totalSpent: number;
}

export function SpendingDonut({ data, totalSpent }: SpendingDonutProps) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`SGD ${value.toFixed(2)}`, '']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label showing total */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-sm text-muted-foreground">Total Spent</span>
        <span className="text-2xl font-bold tabular-nums">
          ${totalSpent.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
```

### Budget Progress Bars

```typescript
// src/components/charts/budget-progress.tsx

'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BudgetWithSpending {
  categoryName: string;
  icon: string;
  color: string;
  budgetAmount: number;
  spentAmount: number;
  percentUsed: number;
  status: 'on_track' | 'warning' | 'over_budget';
}

export function BudgetProgress({ budgets }: { budgets: BudgetWithSpending[] }) {
  return (
    <div className="space-y-4">
      {budgets.map((budget) => (
        <div key={budget.categoryName} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>
              {budget.icon} {budget.categoryName}
            </span>
            <span className={cn(
              'tabular-nums font-medium',
              budget.status === 'over_budget' && 'text-red-500',
              budget.status === 'warning' && 'text-amber-500',
            )}>
              ${budget.spentAmount.toFixed(2)} / ${budget.budgetAmount.toFixed(2)}
            </span>
          </div>
          <Progress
            value={Math.min(budget.percentUsed, 100)}
            className={cn(
              'h-2',
              budget.status === 'over_budget' && '[&>div]:bg-red-500',
              budget.status === 'warning' && '[&>div]:bg-amber-500',
              budget.status === 'on_track' && '[&>div]:bg-green-500',
            )}
          />
          {budget.status === 'over_budget' && (
            <p className="text-xs text-red-400">
              ${(budget.spentAmount - budget.budgetAmount).toFixed(2)} over budget
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔐 Auth Pages

### Login Page (`/login`)

```typescript
// src/app/(auth)/login/page.tsx

'use client';

import { account } from '@/lib/appwrite/client';
import { OAuthProvider } from 'appwrite';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    account.createOAuth2Session(
      OAuthProvider.Google,
      `${window.location.origin}/callback`,
      `${window.location.origin}/login?error=auth_failed`
    );
  };

  const handleGithubLogin = () => {
    account.createOAuth2Session(
      OAuthProvider.Github,
      `${window.location.origin}/callback`,
      `${window.location.origin}/login?error=auth_failed`
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Aura</h1>
          <p className="text-muted-foreground">
            Headless expense tracking powered by AI
          </p>
        </div>
        <div className="space-y-3">
          <Button onClick={handleGoogleLogin} className="w-full" variant="outline">
            Continue with Google
          </Button>
          <Button onClick={handleGithubLogin} className="w-full" variant="outline">
            Continue with GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Callback Page (`/callback`)

```typescript
// src/app/(auth)/callback/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite/client';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        const user = await account.get();
        // Check if user profile exists in our DB, create if first login
        // Seed default categories for new users
        router.push('/');
      } catch {
        router.push('/login?error=auth_failed');
      }
    }
    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
```

---

## 📱 Budget Alert Banner

```typescript
// src/components/alerts/budget-alert-banner.tsx

'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BudgetAlert {
  type: 'warning' | 'over_budget';
  categoryName: string;
  icon: string;
  message: string;
}

export function BudgetAlertBanner({ alerts }: { alerts: BudgetAlert[] }) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when alerts change
  useEffect(() => {
    setDismissed(false);
  }, [alerts]);

  if (dismissed || alerts.length === 0) return null;

  const overBudget = alerts.filter(a => a.type === 'over_budget');
  const warnings = alerts.filter(a => a.type === 'warning');

  return (
    <div className="space-y-2">
      {overBudget.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Over Budget</AlertTitle>
          <AlertDescription>
            {overBudget.map(a => `${a.icon} ${a.message}`).join(' · ')}
          </AlertDescription>
          <Button
            variant="ghost" size="icon"
            className="absolute right-2 top-2"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
      {warnings.length > 0 && (
        <Alert className="border-amber-500/50 text-amber-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Budget Warning</AlertTitle>
          <AlertDescription>
            {warnings.map(a => `${a.icon} ${a.message}`).join(' · ')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

---

## 📦 Key Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "appwrite": "^16.0.0",
    "node-appwrite": "^14.0.0",
    "resend": "^4.0.0",
    "@langchain/core": "^0.3.0",
    "@langchain/openai": "^0.3.0",
    "@langchain/langgraph": "^0.2.0",
    "recharts": "^2.12.0",
    "framer-motion": "^11.18.0",
    "next-themes": "^0.4.0",
    "mem0ai": "^0.1.0",
    "tailwindcss": "^4.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.400.0",
    "zod": "^3.23.0",
    "date-fns": "^3.6.0",
    "date-fns-tz": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "vitest": "^2.0.0",
    "@playwright/test": "^1.45.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```
