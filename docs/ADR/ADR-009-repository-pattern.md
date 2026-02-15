# ADR-009: Repository Pattern

| Field               | Value                                                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Accepted                                                                                                                                                   |
| **Date**            | 2026-02-09                                                                                                                                                 |
| **Decision Makers** | Solutions Architect                                                                                                                                        |
| **References**      | [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md), [ADR-007](ADR-007-dependency-injection.md), [ADR-008](ADR-008-service-layer-pattern.md) |

---

## Context

Services need to access data from Appwrite Cloud. We need to decide whether services should call the Appwrite SDK directly or go through an abstraction layer.

---

## Decision

**Use the Repository pattern — define TypeScript interfaces for all data access, implement them for Appwrite (production) and in-memory (testing).**

---

## Options Considered

### Option A: Repository Pattern — **CHOSEN**

**Pros:**

- **Testability** — Unit tests inject `InMemoryTransactionRepository`, no Appwrite SDK mocking
- **Migration path** — If we switch from Appwrite to Supabase/PostgreSQL in V2, only the repository implementations change. Services remain untouched.
- **Interface-driven** — `ITransactionRepository` defines the data contract. Implementations handle Appwrite-specific query building.
- **Composition** — Complex queries (e.g., sum by category within date range) are encapsulated in the repository, not scattered across services
- **Liskov Substitution** — `Appwrite` and `InMemory` implementations are fully interchangeable

**Cons:**

- More files — 4 interfaces + 4 Appwrite implementations + 4 in-memory implementations = 12 files
- Indirection — reading a transaction requires: route → service → repository → Appwrite SDK
- In-memory implementations must faithfully replicate Appwrite query behavior (sorting, filtering, pagination)

### Option B: Direct Appwrite SDK calls in services

**Pros:**

- Fewer files, less abstraction
- Direct access to Appwrite SDK features
- Faster initial development

**Cons:**

- Services are tightly coupled to Appwrite SDK
- Testing requires `vi.mock('node-appwrite')` — brittle, verbose mocks
- Switching to another database requires rewriting every service
- Appwrite query syntax leaks into business logic

### Option C: ORM (Prisma/Drizzle) with Appwrite adapter

**Pros:**

- Type-safe queries with schema introspection
- Migration management built-in
- Rich query builder

**Cons:**

- Appwrite doesn't have a Prisma/Drizzle adapter — would need a PostgreSQL migration
- ORM adds significant dependency weight
- Appwrite's document model doesn't map cleanly to ORM conventions

---

## Consequences

### Positive

- 4 clean interfaces in `src/lib/repositories/interfaces.ts` — serve as living documentation
- Unit tests run in < 100ms — no network, no database
- Services are database-agnostic — tested against the interface contract
- Repository encapsulates Appwrite-specific query building (Query.equal, Query.orderDesc, etc.)

### Negative

- Must maintain 2 implementations per repository (Appwrite + InMemory)
- In-memory implementations must be kept in sync with Appwrite behavior
  - **Mitigation:** Integration tests run against real Appwrite test database to verify both implementations produce the same results

### Repositories

| Repository               | Methods                                                                                         | Used By                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `ITransactionRepository` | findById, findByUserId, findByResendEmailId, create, update, delete, sumByUserCategoryDateRange | TransactionService, WebhookService, DashboardService |
| `ICategoryRepository`    | findById, findByUserId, create, update, delete, seedDefaults                                    | CategoryService, DashboardService                    |
| `IBudgetRepository`      | findById, findByUserAndPeriod, create, update, delete, deleteByCategoryId                       | BudgetService, DashboardService                      |
| `IVendorCacheRepository` | findByUserAndVendor, create, incrementHitCount, deleteByCategoryId                              | TransactionService, WebhookService                   |
