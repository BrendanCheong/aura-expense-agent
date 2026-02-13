# Test Plan 03 — Service Layer

> **Layer:** Unit Tests  
> **Runner:** Vitest  
> **Mock Data:** `__tests__/fixtures/*.json`  
> **Target Coverage:** 90%+  
> **Pattern:** Services injected with InMemory repositories seeded from JSON fixtures  
> **References:** [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md), [ADR-008](../ADR/ADR-008-service-layer-pattern.md)

---

## Design: Service Test Pattern

```typescript
import { beforeEach, describe, it, expect } from 'vitest';
import { TransactionService } from '@/lib/services/transaction.service';
import { createSeededRepos } from '../../helpers/repository-helpers';

let service: TransactionService;
let repos: ReturnType<typeof createSeededRepos>;

beforeEach(() => {
  repos = createSeededRepos();
  service = new TransactionService(repos.txRepo, repos.vcRepo);
});
```

---

## 1. TransactionService

**File:** `__tests__/unit/services/transaction.service.test.ts`

| # | Test Name | Business Rule | Expected |
|---|-----------|--------------|----------|
| 1 | listTransactions — returns paginated results | Queries use page + limit | 5 per page, total = 16 |
| 2 | listTransactions — filters by category | `categoryId: "cat-food"` | Only food transactions returned |
| 3 | listTransactions — filters by date range | Feb 5-10 | Transactions in range only |
| 4 | listTransactions — isolates by userId | User 002 sees no user 001 data | Empty result |
| 5 | getTransaction — existing, owned | tx-001 by user-001 | Returns transaction |
| 6 | getTransaction — not found | tx-999 | Throws NotFoundError |
| 7 | getTransaction — wrong owner | tx-001 by user-002 | Throws NotFoundError |
| 8 | createManualTransaction — valid | Amount $25.50, vendor "Hawker", cat-food | Created with source "manual", confidence "high" |
| 9 | createManualTransaction — zero amount | Amount 0 | Throws ValidationError |
| 10 | createManualTransaction — negative amount | Amount -10 | Throws ValidationError |
| 11 | createManualTransaction — updates vendor cache | New vendor → cache entry created | Vendor cache has new entry |
| 12 | createManualTransaction — existing vendor in cache | Known vendor | Cache not duplicated |
| 13 | updateTransaction — change category | Re-categorize tx-001 to cat-shopping | Transaction updated + vendor cache updated |
| 14 | updateTransaction — ownership check | User 002 tries to update user 001's tx | Throws NotFoundError |
| 15 | deleteTransaction — existing | Delete tx-001 | Transaction removed |
| 16 | deleteTransaction — ownership check | User 002 tries to delete user 001's tx | Throws NotFoundError |
| 17 | isDuplicate — existing resend_email_id | "resend-001" | Returns true |
| 18 | isDuplicate — new resend_email_id | "resend-new" | Returns false |

## 2. CategoryService

**File:** `__tests__/unit/services/category.service.test.ts`

| # | Test Name | Business Rule | Expected |
|---|-----------|--------------|----------|
| 19 | listCategories — sorted by sort_order | User's categories | 7 categories in order |
| 20 | createCategory — valid | "Subscriptions" with description | Created successfully |
| 21 | createCategory — duplicate name | "Food & Beverage" again | Throws ValidationError |
| 22 | createCategory — auto-increment sort_order | No sort_order provided | Gets max + 1 |
| 23 | updateCategory — change description | cat-food new description | Updated, doesn't affect vendor cache |
| 24 | deleteCategory — no transactions | Delete cat-travel | Deleted + vendor cache + budgets cleaned |
| 25 | deleteCategory — has transactions | Delete cat-food | Moves transactions to "Other" or throws 409 |
| 26 | deleteCategory — cannot delete "Other" | Delete cat-other | Throws ValidationError (system category) |
| 27 | seedDefaults — creates 7 categories | New user ID | 7 default categories created |

## 3. BudgetService

**File:** `__tests__/unit/services/budget.service.test.ts`

| # | Test Name | Business Rule | Expected |
|---|-----------|--------------|----------|
| 28 | getBudgetsForMonth — Feb 2026 | With spending calculations | 7 budgets with percentUsed, status |
| 29 | getBudgetsForMonth — no budgets set | March 2026 | Empty array |
| 30 | createOrUpdateBudget — new | cat-food March 2026 $450 | Created |
| 31 | createOrUpdateBudget — update existing | cat-food Feb 2026 $500 | Updated, not duplicated |
| 32 | createOrUpdateBudget — zero amount | $0 | Throws ValidationError |
| 33 | deleteBudget — existing | Delete budget-001 | Removed |
| 34 | calculateTotalBudget — all categories | Feb 2026 | $1,900 total |
| 35 | getBudgetUtilization — per category | Feb 2026, cat-food | { budget: 400, spent: 121, percent: 30.25% } |

## 4. DashboardService

**File:** `__tests__/unit/services/dashboard.service.test.ts`

| # | Test Name | Business Rule | Expected |
|---|-----------|--------------|----------|
| 36 | getSummary — complete dashboard data | Feb 2026 | totalSpent, totalBudget, categoryBreakdown (7 items), recentTransactions (10 items) |
| 37 | getSummary — category breakdown | Feb 2026 | Food: correct total, correct percentUsed |
| 38 | getSummary — recent transactions | Feb 2026 | Sorted by date desc, has category names |
| 39 | getSummary — empty month | March 2026 | All zeros, empty transactions |
| 40 | getAlerts — over-budget categories | Feb 2026 (shopping over 300) | Returns alert for shopping |
| 41 | getAlerts — warning categories | Feb 2026 | Returns warning for categories at 80%+ |
| 42 | getAlerts — no alerts | All on-track | Empty array |
| 43 | getAlerts — sorted by severity | Over-budget first, then warning | Correct order |

## 5. WebhookService

**File:** `__tests__/unit/services/webhook.service.test.ts`

| # | Test Name | Business Rule | Expected |
|---|-----------|--------------|----------|
| 44 | processInboundEmail — duplicate detection | Existing resend_email_id | Returns `{ status: "duplicate" }` |
| 45 | processInboundEmail — vendor cache hit | Known vendor "GRAB *GRABFOOD" | Returns `{ status: "cached" }`, tx created, hit_count incremented |
| 46 | processInboundEmail — vendor cache miss | Unknown vendor | Invokes agent, returns transactionId |
| 47 | extractRoughVendor — UOB format | "at DIGITALOCEAN.COM. If" | "DIGITALOCEAN.COM" |
| 48 | extractRoughVendor — no match | Newsletter text | null |
| 49 | extractRoughAmount — SGD format | "SGD 16.23" | 16.23 |
| 50 | extractRoughAmount — no match | Newsletter text | null |

---

## Test Data Flow

```
JSON Fixtures → createSeededRepos() → InMemory Repositories → Service constructor
                                                                     ↓
                                              Test method calls service methods
                                                                     ↓
                                              Assertions verify business rules
```
