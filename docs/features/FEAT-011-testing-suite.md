# FEAT-011 — Testing Suite (Unit + Integration + E2E)

> **Status:** 🔴 Not Started  
> **Execution Order:** 12 of 13  
> **Sprint:** 6 — Quality & Ship  
> **Blocked By:** All previous features  
> **Priority:** P0 (Blocker)  
> **Estimate:** 2 days  
> **Assignee:** —

---

## Summary

Implement the full TDD testing suite: Vitest unit tests (~95 tests), Vitest integration tests (~23 tests), and Playwright E2E tests (~27 tests). Tests use JSON fixture data, InMemory repositories, and follow TDD Red-Green-Refactor workflow.

## Acceptance Criteria

- [ ] `npm test` runs all unit + integration tests via Vitest
- [ ] `npm run test:e2e` runs Playwright E2E tests
- [ ] All JSON fixtures in `__tests__/fixtures/` are consumed by tests
- [ ] InMemory repository implementations pass all repository tests
- [ ] Service tests use injected InMemory repositories (no DB needed)
- [ ] Agent tests mock OpenAI and Brave Search APIs
- [ ] Integration tests wire full service stack with test container
- [ ] E2E tests run against local dev server with seeded test data
- [ ] CI pipeline runs: unit → integration → e2e (sequential)
- [ ] Coverage above threshold: Services 90%+, Utils 95%+, Repos 80%+, Agent 85%+

## Test Breakdown

| Layer        | Test Plan                                                       | Test Count |
| ------------ | --------------------------------------------------------------- | ---------- |
| Utils        | [01-utils](../testing-plan/01-utils.test-plan.md)               | 30         |
| Repositories | [02-repositories](../testing-plan/02-repositories.test-plan.md) | 39         |
| Services     | [03-services](../testing-plan/03-services.test-plan.md)         | 50         |
| Agent        | [04-agent](../testing-plan/04-agent.test-plan.md)               | 23         |
| Integration  | [05-integration](../testing-plan/05-integration.test-plan.md)   | 23         |
| E2E          | [06-e2e](../testing-plan/06-e2e.test-plan.md)                   | 27         |
| **Total**    |                                                                 | **~192**   |

## Technical Details

### Files to Create

```
__tests__/
├── fixtures/                    ← Already created (7 JSON files)
├── helpers/
│   └── repository-helpers.ts    ← createSeededRepos() helper
├── unit/
│   ├── utils/
│   │   ├── date.test.ts
│   │   ├── currency.test.ts
│   │   ├── vendor.test.ts
│   │   └── budget.test.ts
│   ├── repositories/
│   │   ├── transaction.repository.test.ts
│   │   ├── category.repository.test.ts
│   │   ├── budget.repository.test.ts
│   │   └── vendor-cache.repository.test.ts
│   ├── services/
│   │   ├── transaction.service.test.ts
│   │   ├── category.service.test.ts
│   │   ├── budget.service.test.ts
│   │   ├── dashboard.service.test.ts
│   │   └── webhook.service.test.ts
│   └── agent/
│       ├── extract-expense.test.ts
│       ├── brave-search.test.ts
│       ├── categorization-chain.test.ts
│       └── agent-graph.test.ts
├── integration/
│   ├── webhook-pipeline.test.ts
│   ├── transaction-crud.test.ts
│   ├── budget-alerts.test.ts
│   ├── category-cascade.test.ts
│   └── auth-context.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── dashboard.spec.ts
    ├── transactions.spec.ts
    ├── budgets.spec.ts
    ├── categories.spec.ts
    └── helpers/
        └── auth.ts
```

## Definition of Done

- [ ] All ~192 tests pass
- [ ] Coverage thresholds met (enforced by Vitest `coverage.thresholds`)
- [ ] CI pipeline YAML committed and passing
- [ ] No flaky tests (retries < 2% failure rate)
- [ ] Test execution time: unit < 10s, integration < 30s, e2e < 120s

## References

- [TESTING_STRATEGY.md](../plans/TESTING_STRATEGY.md) — Original testing strategy
- [Testing Plan README](../testing-plan/README.md) — Master TDD plan
- All 6 individual test plan documents
- [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md) — InMemory implementations
