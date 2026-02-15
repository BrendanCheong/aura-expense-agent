# ADR-007: Dependency Injection Pattern

| Field               | Value                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Accepted                                                                                                                                                 |
| **Date**            | 2026-02-09                                                                                                                                               |
| **Decision Makers** | Solutions Architect                                                                                                                                      |
| **References**      | [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md), [ADR-009](ADR-009-repository-pattern.md), [ADR-008](ADR-008-service-layer-pattern.md) |

---

## Context

Aura's backend follows a layered architecture: API Routes → Services → Repositories. Each layer depends on the layer below. We need a mechanism to:

1. Wire dependencies together (services need repositories, webhook handler needs the agent)
2. Swap implementations for testing (production Appwrite → in-memory for unit tests)
3. Keep API routes thin (no dependency construction in route handlers)

---

## Decision

**Use a lightweight custom DI container (Injector pattern) via `createContainer()`. No DI framework — just a factory function.**

---

## Options Considered

### Option A: Custom DI Container (`createContainer()`) — **CHOSEN**

**Pros:**

- **Zero dependencies** — no `tsyringe`, `inversify`, or `typedi` packages
- **Explicit wiring** — every dependency is visible in `container.ts`, no "magic" decorators
- **Type-safe** — TypeScript interfaces for all dependencies, no runtime reflection
- **Request-scoped** — each API route call creates a fresh container with the current user's Appwrite session
- **Testable** — `createTestContainer()` returns the same interface with in-memory implementations
- **Simple** — < 50 lines of code for the entire DI container
- **Next.js compatible** — no decorator metadata issues with RSC or Edge runtime

**Cons:**

- Manual wiring — must add new services to `container.ts` when adding features
- No lifecycle management (startup/shutdown hooks)
- No automatic dependency resolution — if service A depends on service B, you must wire the order

### Option B: InversifyJS

**Pros:**

- Full-featured DI with decorators (`@injectable`, `@inject`)
- Automatic dependency resolution
- Scoping: singleton, transient, request

**Cons:**

- Requires `reflect-metadata` polyfill — adds complexity
- Decorator-based — potential issues with Next.js RSC and Edge runtime
- Heavy for a small app (10 services max)
- TypeScript decorators may change in future TS versions

### Option C: tsyringe

**Pros:**

- Microsoft-maintained DI container
- Simpler than InversifyJS
- Decorator-based with `@injectable`

**Cons:**

- Same decorator/reflect-metadata issues as InversifyJS
- Less actively maintained recently
- Overkill for the number of services in Aura

### Option D: No DI (direct imports)

**Pros:**

- Simplest possible approach
- No abstraction overhead

**Cons:**

- Impossible to swap implementations for testing without `vi.mock()`
- Tight coupling between API routes and Appwrite SDK
- Business logic mixes with data access in route handlers
- Mock fatigue — every test must mock the same imports

---

## Consequences

### Positive

- API routes are 1-liners: `const { transactionService } = createContainer();`
- Unit tests use `createTestContainer()` — zero mocking, zero network calls
- Adding a new service is a 3-step process: (1) create service class, (2) add to container.ts, (3) use in route
- No runtime overhead — container is just object construction

### Negative

- Must manually maintain `container.ts` as the app grows
- No lazy initialization — all services are created even if the route only uses one
  - **Mitigation:** Services are lightweight (no state, just repository references). Construction is < 1ms.
- No automatic circular dependency detection
  - **Mitigation:** Architecture prevents circular deps by design (routes→services→repos→DB)

### Implementation

```typescript
// One function creates the entire service graph:
export function createContainer(): ServiceContainer {
  const { databases } = getServerAppwrite();
  const repos = RepositoryFactory.create(databases);
  const agent = AgentFactory.create({ ... });

  return {
    transactionService: new TransactionService(repos.transactions, repos.vendorCache),
    categoryService: new CategoryService(repos.categories, repos.vendorCache, repos.budgets),
    budgetService: new BudgetService(repos.budgets, repos.transactions),
    dashboardService: new DashboardService(repos.transactions, repos.budgets, repos.categories),
    webhookService: new WebhookService(repos.transactions, repos.vendorCache, agent),
  };
}
```

---

## Cross-Reference: Comparative Validation (2026-02-14)

A comparative analysis of two production backends — **tcs-core** (Azure Functions, explicit constructor DI) and **aibots-api** (FastAPI, service registry + `Depends`) — independently recommended **explicit constructor DI** as the preferred approach for AI agent backends. Key supporting arguments:

| Report Finding                                                                                                      | Aura's Alignment                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| _"AI services have complex deps (LLM clients, vector stores, memory) — explicit wiring prevents runtime surprises"_ | ✅ `AgentFactory.create(deps)` makes every AI dependency visible. No service registry lookup failures at runtime. |
| _"Explicit DI offers higher discoverability and easier testing via constructor mocking"_                            | ✅ `createTestContainer()` swaps all implementations with zero mocking infrastructure.                            |
| _"Registry-based DI trades boilerplate for implicit dependencies"_                                                  | ✅ Aura's `container.ts` has ~30 lines of explicit wiring. The explicitness cost is minimal for 5 services.       |

**Rejected alternative from report:** The service registry pattern (`service_registry[key] → Service`) used by aibots-api. While it reduces boilerplate via auto-wiring, it introduces runtime resolution failures, makes testing require registry mocking, and hides the dependency graph. For a project with 5 services and < 10 API endpoints, the registry's auto-wiring benefit does not justify the loss in discoverability and type safety.

**Verdict:** The report validates this ADR's decision. Explicit constructor DI is especially well-suited for AI backends where dependencies (LLM clients, search APIs, memory stores) have complex configuration and costly failure modes. A runtime `KeyError` from a service registry is far harder to debug than a missing constructor argument caught at compile time.
