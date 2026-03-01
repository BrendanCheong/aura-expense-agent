# FEAT-007 — Dashboard with Charts & Alerts

> **Status:** � In Progress (Backend Complete)  
> **Execution Order:** 10 of 13  
> **Sprint:** 4 — UI Pages  
> **Blocked By:** FEAT-008, FEAT-009, FEAT-010  
> **Priority:** P0 (Blocker)  
> **Estimate:** 2 days  
> **Assignee:** —

---

## Summary

Build the main dashboard page showing a spending donut chart, per-category budget progress bars, recent transactions list, and budget alert banner.

## User Stories

- **US-3:** "As a user, I want to define monthly budgets per category so I can track how much I've spent vs. my limit."
- **US-4:** "As a user, I want to see my spending as pie/donut charts, broken down by category within a selected time range."
- **US-5:** "As a user, I want to be notified in-app when I'm approaching or exceeding my budget."

## Acceptance Criteria

- [ ] Dashboard page renders at `/` for authenticated users
- [ ] Donut chart shows spending breakdown by category with total in center
- [ ] Budget progress bars show `$spent / $budget` with percentage for each category
- [ ] Color thresholds: Green (< 80%), Amber (80-99%), Red (≥ 100%)
- [ ] Over-budget bars extend past 100% with red overflow
- [ ] Recent transactions list shows latest 10 entries sorted by date desc
- [ ] Time range selector with tabs: Week, Month (default), Year
- [ ] Changing time range re-fetches all dashboard data
- [ ] Budget alert banner shows at top when any category is at 80%+ or over budget
- [ ] Alert banner shows most critical category first (over > warning)
- [ ] "Dismiss" hides banner until next page visit
- [ ] Clicking a donut segment filters the recent transactions table
- [ ] Empty state shows when no transactions exist for the period

## Technical Details

### Files to Create/Modify

| File                                               | Purpose                           |
| -------------------------------------------------- | --------------------------------- |
| `src/app/(dashboard)/page.tsx`                     | Dashboard page (Server Component) |
| `src/components/dashboard/spending-donut.tsx`      | Recharts donut chart              |
| `src/components/dashboard/budget-progress.tsx`     | Budget progress bars              |
| `src/components/dashboard/recent-transactions.tsx` | Transaction list                  |
| `src/components/dashboard/alert-banner.tsx`        | Budget alert banner               |
| `src/components/dashboard/time-range-tabs.tsx`     | Week/Month/Year tabs              |

### API Routes Used

- `GET /api/dashboard/summary` — Category breakdown, totals, recent transactions
- `GET /api/dashboard/alerts` — Budget alert statuses

### Design Patterns

- **Service Layer:** `DashboardService.getSummary()`, `DashboardService.getAlerts()` — [ADR-008](../ADR/ADR-008-service-layer-pattern.md)

## Definition of Done

- [ ] All acceptance criteria pass in browser
- [x] Unit tests: `DashboardService.getSummary()` (8 tests — `dashboard.service.test.ts`)
- [x] Unit tests: `DashboardService.getAlerts()` (4 tests — `dashboard.service.test.ts`)
- [x] Unit tests: `calculateBudgetStatus()` utility (13 tests — `budget.test.ts`)
- [x] Integration tests: Dashboard API routes (17 tests — `dashboard.test.ts`)
- [ ] E2E test: Dashboard loads with data (Playwright) — **blocked by Appwrite SDK + Turbopack runtime issue**
- [ ] Responsive: Mobile card layout, desktop grid layout
- [ ] Accessible: ARIA labels on chart, keyboard navigable tabs
- [x] No TypeScript errors (dashboard code clean; pre-existing issue in user profile route)

## References

- [FRONTEND_ARCHITECTURE.md](../plans/FRONTEND_ARCHITECTURE.md) — Dashboard wireframe
- [UX_DECISIONS.md](../plans/UX_DECISIONS.md) — Dashboard UX, donut chart decisions, progress bar decisions
- [API_SPECIFICATION.md](../plans/API_SPECIFICATION.md) — Dashboard API routes
- [ADR-006](../ADR/ADR-006-recharts.md) — Recharts decision
- [Testing Plan 06](../testing-plan/06-e2e.test-plan.md) — Dashboard E2E tests
