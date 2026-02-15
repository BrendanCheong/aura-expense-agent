# ADR-011: TypeScript as End-to-End Language

| Field               | Value                       |
| ------------------- | --------------------------- |
| **Status**          | Accepted                    |
| **Date**            | 2026-02-09                  |
| **Decision Makers** | Solutions Architect         |
| **References**      | [PLAN.md](../plans/PLAN.md) |

---

## Context

Aura spans frontend (React), backend (Next.js API routes), and AI agent (LangGraph.js). A consistent language across all layers reduces context switching, enables shared types, and simplifies the build toolchain.

---

## Decision

**Use TypeScript (strict mode) across the entire codebase: frontend, API routes, agent, tests, and scripts.**

---

## Options Considered

### Option A: TypeScript end-to-end — **CHOSEN**

**Pros:**

- **Shared types** — `Transaction`, `Category`, `Budget` types used by frontend, API, and agent
- **Zero serialization overhead** — Agent returns typed objects directly to the API route
- **Single toolchain** — One `tsconfig.json`, one linter, one formatter
- **LangGraph.js** is TypeScript-native — Zod schemas, Annotation types, tool interfaces
- **Next.js** is TypeScript-first — `next.config.ts`, typed API routes, typed server actions
- **Developer experience** — Autocomplete, refactoring, and error detection across the entire stack
- **Strict mode** catches null/undefined issues at compile time

**Cons:**

- Python LangGraph has more examples and community support
- TypeScript builds are slower than JavaScript (mitigated by SWC in Next.js)
- Some npm packages lack TypeScript definitions

### Option B: TypeScript frontend + Python backend (agent)

**Pros:**

- Python LangGraph is more mature
- Access to Python ML ecosystem

**Cons:**

- Two languages, two runtimes, two deployment targets
- HTTP bridge between Next.js and Python — latency, error surfaces, serialization
- Duplicate type definitions (TypeScript interfaces + Python Pydantic models)
- Operational complexity: Docker, health checks, versioning across two services

---

## Consequences

### Positive

- Single `package.json` — all dependencies managed in one place
- Types flow from database schema → API response → frontend component without manual mapping
- Refactoring a field name (e.g., `category_id` → `categoryId`) is caught everywhere by the compiler
- Agent tool schemas (Zod) generate both runtime validation and TypeScript types

### Negative

- Missing some Python LangGraph features that haven't been ported to TypeScript yet
- TypeScript compile errors can be cryptic (complex generics in LangGraph types)
