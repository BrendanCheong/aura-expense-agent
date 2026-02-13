# Test Plan 02 — Repository Layer

> **Layer:** Unit Tests  
> **Runner:** Vitest  
> **Mock Data:** `__tests__/fixtures/*.json`  
> **Target Coverage:** 80%+  
> **Pattern:** Tests run against `InMemory*Repository` implementations  
> **References:** [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md), [ADR-009](../ADR/ADR-009-repository-pattern.md)

---

## Design: Repository Test Pattern

Each in-memory repository is tested to ensure it faithfully implements the interface contract. This guarantees that services work correctly when wired with either implementation.

```typescript
// Pattern used across all repository tests:
import { beforeEach, describe, it, expect } from 'vitest';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import transactions from '../../fixtures/transactions.json';

let repo: InMemoryTransactionRepository;

beforeEach(() => {
  repo = new InMemoryTransactionRepository();
  // Seed from JSON fixtures
  for (const tx of transactions) {
    repo.create(tx);
  }
});
```

---

## 1. Transaction Repository

**File:** `__tests__/unit/repositories/transaction.repository.test.ts`  
**Fixtures:** `transactions.json`, `users.json`

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 1 | findById — existing transaction | `findById("tx-001")` | Returns transaction with vendor "GRAB *GRABFOOD" |
| 2 | findById — non-existent | `findById("tx-999")` | Returns `null` |
| 3 | findByResendEmailId — existing | `findByResendEmailId("resend-001")` | Returns tx-001 |
| 4 | findByResendEmailId — non-existent | `findByResendEmailId("resend-999")` | Returns `null` |
| 5 | findByUserId — paginated (page 1) | `findByUserId("test-user-001", { page: 1, limit: 5 })` | Returns 5 items, `hasMore: true` |
| 6 | findByUserId — paginated (last page) | `findByUserId("test-user-001", { page: 4, limit: 5 })` | Returns remaining items, `hasMore: false` |
| 7 | findByUserId — filter by category | `{ categoryId: "cat-food" }` | Returns only food transactions |
| 8 | findByUserId — filter by date range | `{ startDate: "2026-02-05", endDate: "2026-02-10" }` | Returns transactions in range |
| 9 | findByUserId — filter by source (email) | `{ source: "email" }` | Excludes manual transactions |
| 10 | findByUserId — wrong user | `findByUserId("test-user-002", ...)` | Returns empty |
| 11 | findByUserAndDateRange — February 2026 | `"2026-02-01" to "2026-03-01"` | Returns all 16 fixtures |
| 12 | create — new transaction | Create with valid data | Returns with generated ID |
| 13 | create — resend_email_id dedup | Create with existing `resend_email_id` | Should handle gracefully |
| 14 | update — change category | Update tx-001 categoryId | Returned transaction reflects change |
| 15 | delete — existing | Delete tx-001 | findById returns null |
| 16 | sumByUserCategoryDateRange | Feb 2026 all categories | Returns correct per-category totals |

## 2. Category Repository

**File:** `__tests__/unit/repositories/category.repository.test.ts`  
**Fixtures:** `categories.json`

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 17 | findByUserId — returns all categories | User test-user-001 | Returns 7 categories |
| 18 | findByUserId — ordered by sort_order | — | Food (1), Transport (2), ... Other (7) |
| 19 | findByUserIdAndName — exact match | `"Food & Beverage"` | Returns cat-food |
| 20 | findByUserIdAndName — case sensitivity | `"food & beverage"` | Returns null (exact match only) |
| 21 | create — new custom category | `{ name: "Subscriptions", ... }` | Created with generated ID |
| 22 | create — duplicate name | Same name as existing | Should throw or return error |
| 23 | update — change description | Update cat-food description | Description updated |
| 24 | delete — existing category | Delete cat-other | findById returns null |
| 25 | seedDefaults — new user | seedDefaults("new-user-id") | Creates 7 default categories |

## 3. Budget Repository

**File:** `__tests__/unit/repositories/budget.repository.test.ts`  
**Fixtures:** `budgets.json`

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 26 | findByUserAndPeriod — Feb 2026 | `(user, 2026, 2)` | Returns 7 budgets |
| 27 | findByUserAndPeriod — no budgets | `(user, 2026, 3)` | Returns empty array |
| 28 | findByUserCategoryPeriod — specific | `(user, "cat-food", 2026, 2)` | Returns budget of $400 |
| 29 | create — new budget | March 2026, cat-food, $450 | Created successfully |
| 30 | update — change amount | budget-001: $400 → $500 | Amount updated |
| 31 | delete — existing budget | Delete budget-001 | findById returns null |
| 32 | deleteByCategoryId — cascade | Delete all for cat-food | No budgets found for cat-food |

## 4. Vendor Cache Repository

**File:** `__tests__/unit/repositories/vendor-cache.repository.test.ts`  
**Fixtures:** `vendor-cache.json`

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 33 | findByUserAndVendor — cache hit | `"GRAB *GRABFOOD"` | Returns entry with cat-food |
| 34 | findByUserAndVendor — cache miss | `"UNKNOWN VENDOR"` | Returns null |
| 35 | findByUserAndVendor — wrong user | User 002 searches for user 001's vendors | Returns null |
| 36 | create — new cache entry | `"STARBUCKS VIVOCITY" → cat-food` | Created with hit_count = 1 |
| 37 | incrementHitCount — existing | vc-001 from 15 → 16 | Hit count incremented |
| 38 | deleteByCategoryId — cascade | Delete all for cat-food | GRAB *GRABFOOD entry removed |
| 39 | findByUserId — all entries | User 001 | Returns 7 entries |

---

## Shared Test Helpers

```typescript
// __tests__/helpers/repository-helpers.ts

import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import { InMemoryBudgetRepository } from '@/lib/repositories/in-memory/budget.repository';
import { InMemoryVendorCacheRepository } from '@/lib/repositories/in-memory/vendor-cache.repository';
import transactions from '../fixtures/transactions.json';
import categories from '../fixtures/categories.json';
import budgets from '../fixtures/budgets.json';
import vendorCache from '../fixtures/vendor-cache.json';

export function createSeededRepos() {
  const txRepo = new InMemoryTransactionRepository();
  const catRepo = new InMemoryCategoryRepository();
  const budgetRepo = new InMemoryBudgetRepository();
  const vcRepo = new InMemoryVendorCacheRepository();

  transactions.forEach(tx => txRepo.create(tx));
  categories.forEach(cat => catRepo.create(cat));
  budgets.forEach(b => budgetRepo.create(b));
  vendorCache.forEach(vc => vcRepo.create(vc.user_id, vc.vendor_name, vc.category_id));

  return { txRepo, catRepo, budgetRepo, vcRepo };
}
```
