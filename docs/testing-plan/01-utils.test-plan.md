# Test Plan 01 — Utility Functions

> **Layer:** Unit Tests  
> **Runner:** Vitest  
> **Mock Data:** `__tests__/fixtures/email-samples.json`, `__tests__/fixtures/transactions.json`  
> **Target Coverage:** 95%+

---

## 1. Date Utilities (`src/lib/utils/date.ts`)

**File:** `__tests__/unit/utils/date.test.ts`

| #   | Test Name                                   | Input                                | Expected Output                                    | Business Rule                      |
| --- | ------------------------------------------- | ------------------------------------ | -------------------------------------------------- | ---------------------------------- |
| 1   | parseEmailDate — DD/MM/YY bank format       | `"08/02/26"`                         | `2026-02-08T00:00:00.000Z`                         | Singapore bank alerts use DD/MM/YY |
| 2   | parseEmailDate — DD/MM/YYYY format          | `"08/02/2026"`                       | `2026-02-08`                                       | Alternative date format            |
| 3   | parseEmailDate — ISO 8601 UTC from Resend   | `"2026-02-08T01:31:11.894719+00:00"` | `2026-02-08`                                       | Resend webhook timestamps are UTC  |
| 4   | parseEmailDate — "DD Mon YYYY" format       | `"09 Feb 2026"`                      | `2026-02-09`                                       | DBS uses this format               |
| 5   | convertToSGT — UTC midnight → SGT +8h       | `"2026-02-08T00:00:00Z"`             | `"2026-02-08T08:00:00+08:00"`                      | All dates stored in SGT            |
| 6   | convertToSGT — UTC 20:00 → SGT next day     | `"2026-02-08T20:00:00Z"`             | Contains `"2026-02-09"`                            | Day rollover                       |
| 7   | getMonthRange — February 2026               | `(2026, 2)`                          | `{ start: "2026-02-01...", end: "2026-03-01..." }` | Dashboard month queries            |
| 8   | getMonthRange — December → January boundary | `(2025, 12)`                         | `{ start: "2025-12-01...", end: "2026-01-01..." }` | Year boundary                      |
| 9   | getWeekRange — Week of Feb 8                | `"2026-02-08"`                       | `{ start: "2026-02-02...", end: "2026-02-09..." }` | Week starts Monday (SGT)           |
| 10  | formatDisplayDate — ISO to display          | `"2026-02-08T09:31:00+08:00"`        | `"08 Feb 2026"`                                    | UI display format                  |

## 2. Currency Utilities (`src/lib/utils/currency.ts`)

**File:** `__tests__/unit/utils/currency.test.ts`

| #   | Test Name                                | Input                      | Expected Output | Business Rule           |
| --- | ---------------------------------------- | -------------------------- | --------------- | ----------------------- |
| 11  | parseAmountFromText — SGD format         | `"SGD 16.23"`              | `16.23`         | UOB bank alert format   |
| 12  | parseAmountFromText — S$ format          | `"S$89.99"`                | `89.99`         | OCBC format             |
| 13  | parseAmountFromText — $ with SGD context | `"Total: $89.99 SGD"`      | `89.99`         | Merchant receipt format |
| 14  | parseAmountFromText — comma thousands    | `"SGD 1,234.56"`           | `1234.56`       | Large amounts           |
| 15  | parseAmountFromText — no amount found    | `"Welcome to our service"` | `null`          | Non-transaction email   |
| 16  | formatSGD — standard                     | `1023.5`                   | `"$1,023.50"`   | Dashboard display       |
| 17  | formatSGD — zero                         | `0`                        | `"$0.00"`       | Empty state             |
| 18  | formatSGD — negative (over budget)       | `-27.19`                   | `"-$27.19"`     | Over-budget display     |

## 3. Vendor Utilities (`src/lib/utils/vendor.ts`)

**File:** `__tests__/unit/utils/vendor.test.ts`

| #   | Test Name                              | Input                             | Expected Output       | Business Rule                   |
| --- | -------------------------------------- | --------------------------------- | --------------------- | ------------------------------- |
| 19  | normalizeVendorName — uppercase + trim | `"  Grab *GrabFood  "`            | `"GRAB *GRABFOOD"`    | Cache key normalization         |
| 20  | normalizeVendorName — trailing dots    | `"DIGITALOCEAN.COM."`             | `"DIGITALOCEAN.COM"`  | Remove trailing punctuation     |
| 21  | normalizeVendorName — collapse spaces  | `"YA  KUN   KAYA TOAST"`          | `"YA KUN KAYA TOAST"` | Consistent spacing              |
| 22  | extractRoughVendor — UOB format        | `"...at DIGITALOCEAN.COM. If..."` | `"DIGITALOCEAN.COM"`  | Regex fast path for cache check |
| 23  | extractRoughVendor — no vendor found   | `"Welcome newsletter"`            | `null`                | Non-transaction emails          |

## 4. Budget Utilities (`src/lib/utils/budget.ts`)

**File:** `__tests__/unit/utils/budget.test.ts`

| #   | Test Name                                    | Input                                  | Expected Output                                  | Business Rule            |
| --- | -------------------------------------------- | -------------------------------------- | ------------------------------------------------ | ------------------------ |
| 24  | calculateBudgetStatus — on_track (< 80%)     | `spent: 200, budget: 400`              | `{ percentUsed: 50, status: "on_track" }`        | Green indicator          |
| 25  | calculateBudgetStatus — warning (80-99%)     | `spent: 85, budget: 100`               | `status: "warning"`                              | Amber indicator at 80%+  |
| 26  | calculateBudgetStatus — over_budget (≥ 100%) | `spent: 327.19, budget: 300`           | `{ percentUsed: 109.06, status: "over_budget" }` | Red indicator            |
| 27  | calculateBudgetStatus — zero budget          | `spent: 50, budget: 0`                 | `status: "over_budget"`                          | Edge case: no budget set |
| 28  | getBudgetAlerts — mixed statuses             | 3 categories (on_track, over, warning) | 2 alerts (over first, then warning)              | Dashboard alert banner   |
| 29  | getBudgetAlerts — all on track               | 1 category at 50%                      | `[]`                                             | No alerts                |
| 30  | calculatePercentageAllocation — even split   | `totalBudget: 1900, categories: 7`     | Proportional percentages summing to 100%         | Budget allocation UX     |

---

## TDD Sequence

```
1. Write test #1 (parseEmailDate DD/MM/YY) → RED
2. Implement parseEmailDate() with DD/MM/YY regex → GREEN
3. Write test #2 (DD/MM/YYYY) → RED → extend regex → GREEN
4. Write test #3 (ISO 8601) → RED → add ISO parsing → GREEN
5. Refactor: extract regex patterns to constants → REFACTOR
6. Continue for each test...
```
