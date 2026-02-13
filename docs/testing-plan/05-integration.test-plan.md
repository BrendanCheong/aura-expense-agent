# Test Plan 05 — Integration Tests

> **Layer:** Integration Tests  
> **Runner:** Vitest  
> **Mock Data:** `__tests__/fixtures/*.json`  
> **Target Coverage:** 70%+  
> **Pattern:** Full service stack with InMemory repositories, mocked external APIs (Resend, OpenAI, Brave, Mem0)  
> **References:** [API_SPECIFICATION.md](../plans/API_SPECIFICATION.md), [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md), [AI_AGENT_ARCHITECTURE.md](../plans/AI_AGENT_ARCHITECTURE.md)

---

## Design: Integration Test Pattern

Integration tests wire multiple layers together but still use in-memory repositories and mocked externals:

```typescript
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { createTestContainer } from '@/lib/container';
import type { ServiceContainer } from '@/lib/container';

let container: ServiceContainer;

beforeEach(() => {
  container = createTestContainer();
});
```

---

## 1. Webhook → Transaction Pipeline

**File:** `__tests__/integration/webhook-pipeline.test.ts`  
**Fixtures:** `webhook-payloads.json`, `email-samples.json`, `categories.json`, `vendor-cache.json`

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 1 | Full pipeline — UOB email → cached vendor | UOB email for GRAB *GRABFOOD (in cache) | Transaction created with cat-food, vendor cache hit_count incremented, no agent invoked |
| 2 | Full pipeline — DBS email → agent required | DBS email for new vendor | Agent invoked, transaction created with agent-assigned category |
| 3 | Full pipeline — non-transaction email | Newsletter webhook | Returns `{ status: "skipped" }`, no transaction created |
| 4 | Full pipeline — duplicate email | Same resend_email_id sent twice | Second call returns `{ status: "duplicate" }`, no duplicate transaction |
| 5 | Full pipeline — OCBC email → agent + Brave search | OCBC for unknown vendor | Agent uses brave_search tool, transaction created |
| 6 | Full pipeline — Mem0 recall resolves category | Cache miss, Mem0 has user preference | Transaction created with Mem0-recalled category, no Brave search |
| 7 | Webhook signature validation | Invalid Svix signature | Returns 401, no processing |
| 8 | Webhook idempotency | Resend sends same webhook event 3 times | Only 1 transaction created |

## 2. Transaction CRUD Flow

**File:** `__tests__/integration/transaction-crud.test.ts`  
**Fixtures:** `transactions.json`, `categories.json`, `budgets.json`

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 8 | Create manual → appears in list | Create $25.50 at "Hawker Center" | Listed in transactions, updates dashboard totals |
| 9 | Update category → vendor cache updated | Re-categorize GRAB from food to transport | Vendor cache entry updated, dashboard recalculated |
| 10 | Delete → removed from dashboard | Delete tx-001 | Not in list, totals reduced, dashboard updated |
| 11 | Pagination → consistent pages | Fetch page 1, then page 2 | No overlap, sorted by date desc |

## 3. Budget Alert Flow

**File:** `__tests__/integration/budget-alerts.test.ts`  
**Fixtures:** `budgets.json`, `transactions.json`, `categories.json`

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 12 | New transaction pushes category over budget | Add $200 to Shopping (budget $300, already $327.19) | Alert generated for Shopping |
| 13 | New transaction pushes category to warning | Transaction brings Food to 82% | Warning alert generated |
| 14 | Budget update resolves alert | Increase Shopping budget to $600 | Alert cleared |
| 15 | Dashboard shows all alerts | Over-budget + warning categories | Both shown, sorted by severity |

## 4. Category Cascade

**File:** `__tests__/integration/category-cascade.test.ts`  
**Fixtures:** All fixture files

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 16 | Delete category → transactions move to Other | Delete "Transport" | Transport transactions have categoryId = cat-other |
| 17 | Delete category → vendor cache cleaned | Delete "Transport" | No vendor cache entries for Transport |
| 18 | Delete category → budgets removed | Delete "Transport" | No budget for Transport in Feb 2026 |
| 19 | Cannot delete "Other" | Attempt delete cat-other | 400 error, category still exists |

## 5. AI Feedback Pipeline

**File:** `__tests__/integration/feedback-pipeline.test.ts`  
**Fixtures:** `transactions.json`, `categories.json`

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 20 | Process feedback → AI returns proposal | User submits "This should be Bills" for a Shopping tx | Response: `{ proposedCategoryId: 'cat-bills', reasoning: '...' }` |
| 21 | Approve feedback → updates tx + cache + Mem0 | User approves proposal | Transaction category updated, vendor_cache updated, Mem0.add() called |
| 22 | Multi-round feedback (reject then approve) | User rejects first proposal, refines, approves second | Conversation history maintained, final proposal applied |
| 23 | Feedback memory recalled on next categorization | After feedback stored, new email from same vendor | Mem0 recall returns preference, agent uses it |
| 24 | Max 3 rounds enforced | User rejects 3 proposals | 4th round returns error, last proposal auto-applied |

## 6. Auth Context Flow

**File:** `__tests__/integration/auth-context.test.ts`

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 25 | User isolation — transactions | User 002 lists transactions | Only user 002's transactions (none) |
| 26 | User isolation — categories | User 002 lists categories | Only user 002's categories |
| 27 | User isolation — budgets | User 002 lists budgets | Only user 002's budgets |
| 28 | Unauthenticated request | No session cookie | 401 response |

---

## Integration Test Data Flow

```
Webhook Payload (fixture)
        ↓
   WebhookService.processInboundEmail()
        ↓
   ┌─ Dedup check (TransactionRepo) ←── InMemory, seeded from transactions.json
   │
   ├─ Vendor cache check (VendorCacheRepo) ←── InMemory, seeded from vendor-cache.json
   │
   └─ Agent invocation (mocked) ←── Returns fixture-based response
        ↓
   TransactionService.create() 
        ↓
   DashboardService.getSummary() ←── Verifies end-to-end totals
```
