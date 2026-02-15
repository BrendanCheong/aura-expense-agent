# Aura Expense Agent — Testing Plan

> **Methodology:** Test-Driven Development (TDD)  
> **Test Runner:** Vitest (unit + integration)  
> **E2E:** Playwright  
> **Mock Data:** JSON fixtures (not hardcoded variables)  
> **Test DB:** Separate Appwrite database (`aura_expense_db_test`)  
> **References:** [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md), [ADR-009](../ADR/ADR-009-repository-pattern.md)

---

## TDD Workflow

Every feature follows a strict **Red → Green → Refactor** cycle:

```
1. RED:    Write the test first → it fails (feature doesn't exist)
2. GREEN:  Write the minimum code to make the test pass
3. REFACTOR: Improve the code without changing behavior → tests still pass
```

### TDD Rules

- **No production code without a failing test first**
- **Each test file covers one feature or one module**
- **Mock data lives in JSON files** in `__tests__/fixtures/` — never hardcoded in test files
- **In-memory repositories** for unit tests — zero network calls
- **Real Appwrite** (test database) for integration tests
- **Test names describe the business rule**, not the implementation

---

## Test Architecture

```
__tests__/
├── fixtures/                          ← JSON mock data (shared)
│   ├── users.json
│   ├── categories.json
│   ├── transactions.json
│   ├── budgets.json
│   ├── vendor-cache.json
│   ├── webhook-payloads.json
│   └── email-samples.json
├── unit/
│   ├── services/                      ← Service layer tests
│   │   ├── transaction.service.test.ts
│   │   ├── category.service.test.ts
│   │   ├── budget.service.test.ts
│   │   ├── dashboard.service.test.ts
│   │   └── webhook.service.test.ts
│   ├── repositories/                  ← In-memory repository tests
│   │   ├── transaction.repository.test.ts
│   │   ├── category.repository.test.ts
│   │   ├── budget.repository.test.ts
│   │   └── vendor-cache.repository.test.ts
│   ├── agent/                         ← Agent tool + graph tests
│   │   ├── extract-expense.test.ts
│   │   ├── brave-search.test.ts
│   │   ├── categorization-chain.test.ts
│   │   └── agent-graph.test.ts
│   └── utils/                         ← Utility function tests
│       ├── date.test.ts
│       ├── currency.test.ts
│       ├── vendor.test.ts
│       └── budget.test.ts
├── integration/
│   ├── webhook-pipeline.test.ts       ← Full webhook → agent → DB flow
│   ├── transaction-crud.test.ts       ← API route → service → DB
│   ├── budget-alerts.test.ts          ← Budget calculation integration
│   └── category-cascade.test.ts       ← Category delete cascading
└── e2e/
    ├── auth.spec.ts                   ← OAuth2 login/logout flow
    ├── dashboard.spec.ts              ← Dashboard charts + data display
    ├── transactions.spec.ts           ← Transaction table + CRUD
    ├── budgets.spec.ts                ← Budget management + alerts
    └── categories.spec.ts             ← Category CRUD
```

---

## Fixture Management

All mock data lives in `__tests__/fixtures/*.json`. Test files import fixtures and use them to seed in-memory repositories.

### Loading Fixtures

```typescript
// __tests__/helpers/fixtures.ts

import users from '../fixtures/users.json';
import categories from '../fixtures/categories.json';
import transactions from '../fixtures/transactions.json';
import budgets from '../fixtures/budgets.json';
import vendorCache from '../fixtures/vendor-cache.json';
import webhookPayloads from '../fixtures/webhook-payloads.json';
import emailSamples from '../fixtures/email-samples.json';

export const fixtures = {
  users,
  categories,
  transactions,
  budgets,
  vendorCache,
  webhookPayloads,
  emailSamples,
} as const;

// Helper: seed an in-memory repository from fixtures
export function seedTransactionRepo(repo: InMemoryTransactionRepository, userId?: string) {
  const txs = userId
    ? fixtures.transactions.filter((tx) => tx.user_id === userId)
    : fixtures.transactions;

  for (const tx of txs) {
    repo.create(tx);
  }
}
```

---

## Test Coverage Targets

| Layer                   | Target | Rationale                                                   |
| ----------------------- | ------ | ----------------------------------------------------------- |
| Services                | 90%+   | All business rules must be tested                           |
| Repositories (InMemory) | 80%+   | Verify CRUD + query behavior matches interfaces             |
| Agent Tools             | 85%+   | Extraction accuracy is critical                             |
| Utils                   | 95%+   | Pure functions, no excuse not to test                       |
| API Routes              | 70%+   | Integration tests cover the happy paths                     |
| UI Components           | 60%+   | Visual testing is less valuable for a chart-heavy dashboard |

---

## Individual Test Plans

Each feature has a dedicated test plan document:

| Document                                                     | Feature                                            | Tests                 |
| ------------------------------------------------------------ | -------------------------------------------------- | --------------------- |
| [01-utils.test-plan.md](01-utils.test-plan.md)               | Utility Functions (date, currency, vendor, budget) | ~20 unit tests        |
| [02-repositories.test-plan.md](02-repositories.test-plan.md) | Repository Layer (InMemory implementations)        | ~25 unit tests        |
| [03-services.test-plan.md](03-services.test-plan.md)         | Service Layer (business logic)                     | ~30 unit tests        |
| [04-agent.test-plan.md](04-agent.test-plan.md)               | AI Agent (tools, graph, categorization)            | ~15 unit tests        |
| [05-integration.test-plan.md](05-integration.test-plan.md)   | Integration Tests (API routes, webhook pipeline)   | ~15 integration tests |
| [06-e2e.test-plan.md](06-e2e.test-plan.md)                   | E2E Tests (Playwright browser flows)               | ~8 E2E tests          |

---

## Vitest Configuration

```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    exclude: ['__tests__/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**'],
      exclude: ['src/lib/appwrite/**', 'src/components/**'],
      thresholds: {
        global: {
          branches: 70,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    setupFiles: ['__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

### Test Setup

```typescript
// __tests__/setup.ts

// Set test environment variables
process.env.APPWRITE_ENDPOINT = 'https://test.appwrite.io/v1';
process.env.APPWRITE_PROJECT_ID = 'test-project';
process.env.APPWRITE_API_KEY = 'test-api-key';
process.env.APPWRITE_DATABASE_ID = 'aura_expense_db_test';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.BRAVE_SEARCH_API_KEY = 'test-brave-key';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.RESEND_WEBHOOK_SECRET = 'test-webhook-secret';
```

---

## CI Pipeline

```yaml
# .github/workflows/test.yml

name: Test Suite
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  integration:
    runs-on: ubuntu-latest
    needs: unit
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:integration
    env:
      APPWRITE_ENDPOINT: ${{ secrets.TEST_APPWRITE_ENDPOINT }}
      APPWRITE_PROJECT_ID: ${{ secrets.TEST_APPWRITE_PROJECT_ID }}
      APPWRITE_API_KEY: ${{ secrets.TEST_APPWRITE_API_KEY }}

  e2e:
    runs-on: ubuntu-latest
    needs: integration
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
```
