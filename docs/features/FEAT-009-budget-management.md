# FEAT-009 — Budget Management & Salary Allocation

> **Status:** � Done  
> **Execution Order:** 9 of 13  
> **Sprint:** 4 — UI Pages  
> **Blocked By:** FEAT-001, FEAT-010  
> **Priority:** P0 (Blocker)  
> **Estimate:** 1.5 days  
> **Assignee:** —

---

## Summary

Build the budget management page with two modes: Direct Amount entry per category and Salary Percentage Allocation. Users set monthly budgets that drive the dashboard progress bars and alert system.

## User Stories

- **US-3:** "As a user, I want to define monthly budgets per category so I can track how much I've spent vs. my limit."
- **US-5:** "As a user, I want to be notified in-app when I'm approaching or exceeding my budget."

## Acceptance Criteria

### Mode A: Direct Amount

- [x] `/budgets` shows all categories with inline editable budget amounts
- [x] Progress bar per category showing `$spent / $budget`
- [x] Total budget shown at bottom (sum of all categories)
- [x] Tab through categories to quickly set all amounts
- [x] Budget amounts saved per category per month

### Mode B: Salary Allocation

- [x] Toggle button switches to "% Allocate" mode
- [x] Monthly salary input field at top (stored in user profile)
- [x] Percentage input per category, dollar amounts auto-calculate
- [x] Unallocated remainder shown as "Savings" (informational row)
- [x] Allocation bar visualization (allocated vs. savings)
- [x] "Apply Allocation" converts percentages to dollar budgets
- [x] Percentages do NOT need to sum to 100%

### Shared

- [x] Month/year selector for viewing and editing different months
- [x] Budgets are month-specific (can differ month to month)
- [x] Empty state when no budgets set for selected month
- [x] Salary is persisted in user profile and reused next month

## Technical Details

### Files to Create/Modify

| File                                           | Purpose                    |
| ---------------------------------------------- | -------------------------- |
| `src/app/(dashboard)/budgets/page.tsx`         | Budget page                |
| `src/components/budgets/BudgetList.tsx`         | Direct amount mode         |
| `src/components/budgets/SalaryAllocation.tsx`   | Percentage allocation mode |
| `src/components/budgets/AllocationBar.tsx`      | Visual allocation bar      |
| `src/components/budgets/MonthSelector.tsx`      | Month/year navigation      |
| `src/components/budgets/BudgetProgressBar.tsx`  | Status-colored progress bar|
| `src/hooks/use-budgets.ts`                      | Budget data fetching hook  |
| `src/hooks/use-user-profile.ts`                 | User profile hook          |

### API Routes Used

- `GET /api/budgets?year=2026&month=2` — List budgets for month
- `POST /api/budgets` — Create/update budget
- `DELETE /api/budgets/[id]` — Delete budget
- `PATCH /api/user/profile` — Update salary + budget_mode

### Data Model

```typescript
// User profile additions
monthly_salary: number | null; // e.g., 5000.00
budget_mode: 'direct' | 'percentage';

// Budget amounts always stored as absolute dollars
// Percentages are a UI concern, not a data concern
```

## Definition of Done

- [x] All acceptance criteria pass in browser (both modes)
- [x] Unit tests: `BudgetService` (12 tests)
- [x] Unit tests: React component tests (35 tests)
- [x] MSW integration tests: `useBudgets` + `useUserProfile` hooks (9 tests)
- [ ] E2E test: Budget page renders, edit amount, salary allocation (Playwright)
- [x] Responsive: Stacked layout on mobile
- [x] No TypeScript errors

## References

- [UX_DECISIONS.md](../plans/UX_DECISIONS.md) — Section 5: Budget UX — Salary & Percentage Allocation (wireframes)
- [FRONTEND_ARCHITECTURE.md](../plans/FRONTEND_ARCHITECTURE.md) — Budget wireframe
- [API_SPECIFICATION.md](../plans/API_SPECIFICATION.md) — Budget CRUD routes
- [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md) — `budgets` table + `users` salary field
- [Testing Plan 06](../testing-plan/06-e2e.test-plan.md) — Budget E2E tests
