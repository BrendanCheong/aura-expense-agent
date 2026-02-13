# ADR-008: Service Layer Pattern

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-09 |
| **Decision Makers** | Solutions Architect |
| **References** | [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md), [ADR-007](ADR-007-dependency-injection.md), [ADR-009](ADR-009-repository-pattern.md) |

---

## Context

API routes in Next.js App Router are thin HTTP handlers. We need a clear boundary between HTTP concerns (request parsing, response formatting, status codes) and business logic (dedup, budget calculations, vendor cache updates, category cascading).

---

## Decision

**Extract all business logic into Service classes. API routes only handle HTTP concerns and delegate to services.**

---

## Options Considered

### Option A: Service Layer (separate classes) — **CHOSEN**

**Pros:**
- **Testable** — services are testable with injected in-memory repositories, no HTTP needed
- **Reusable** — `DashboardService` methods are called from both the dashboard API and the budget alerts API
- **Single Responsibility** — API route handles HTTP, service handles logic, repository handles data
- **Type-safe** — service methods have typed inputs and outputs
- **Documentation** — service interfaces serve as living documentation of business rules

**Cons:**
- More files and boilerplate than putting logic directly in routes
- Indirection — tracing a request requires jumping API route → service → repository

### Option B: Logic in API Routes (no service layer)

**Pros:**
- Less files, less indirection
- Simple for small apps
- Faster initial development

**Cons:**
- Untestable without spinning up an HTTP server
- Business logic duplicated across routes (e.g., budget calculation in dashboard API and alerts API)
- Route handlers grow to 100+ lines with mixed concerns
- Impossible to reuse business logic outside of API routes

### Option C: Use Case / Interactor pattern (Clean Architecture)

**Pros:**
- Each use case is a single class with one `execute()` method
- Very granular — one class per business operation

**Cons:**
- Explosion of tiny classes (CreateTransaction, UpdateTransaction, DeleteTransaction, ListTransactions, etc.)
- Overkill for Aura's scope — 5 services cover all business logic
- More boilerplate than the service pattern

---

## Consequences

### Positive
- Business rules are centralized in 5 services:
  | Service | Responsibility |
  |---------|---------------|
  | `TransactionService` | CRUD, dedup, vendor cache on manual entries |
  | `CategoryService` | CRUD, seed defaults, cascade deletes |
  | `BudgetService` | CRUD, budget vs actual calculations |
  | `DashboardService` | Aggregations, alerts, summary data |
  | `WebhookService` | Email pipeline: dedup → cache → agent → log |
- Each service is tested independently with in-memory repositories
- API routes are < 20 lines each

### Negative
- Must be disciplined about not letting business logic leak into API routes
- New developers need to understand the layered architecture
