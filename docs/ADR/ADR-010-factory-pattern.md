# ADR-010: Factory Pattern for Agent and Repository Creation

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-09 |
| **Decision Makers** | Solutions Architect |
| **References** | [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md), [ADR-007](ADR-007-dependency-injection.md), [ADR-003](ADR-003-langgraph-agent.md) |

---

## Context

Creating the LangGraph agent requires wiring together multiple components: model configuration, API keys, tool instances, and repository dependencies. Similarly, creating the full set of repositories requires an Appwrite `Databases` instance. This construction logic should not live inside API routes or services.

---

## Decision

**Use the Factory pattern for creating complex object graphs: `AgentFactory` for the LangGraph agent and `RepositoryFactory` for the repository set.**

---

## Options Considered

### Option A: Factory Pattern — **CHOSEN**

**Pros:**
- **Encapsulation** — All agent construction logic lives in `AgentFactory.create(deps)`
- **Dual-mode creation** — `AgentFactory.create()` for production, `AgentFactory.createForTesting()` for tests
- **Single point of change** — Adding a new tool or changing the model only modifies the factory
- **Readability** — Container says `AgentFactory.create(deps)`, not 20 lines of tool wiring

**Cons:**
- One more file per factory (2 factory files total)
- Factory hides construction details — must look at factory source to understand what's created

### Option B: Direct construction in DI container

**Pros:**
- All construction visible in one file
- No extra abstraction

**Cons:**
- Container becomes bloated with agent wiring (model config, tool creation, etc.)
- Cannot reuse agent construction in tests without duplicating code
- Mixing repository creation and agent creation in one function

---

## Consequences

### Positive
- `AgentFactory.createForTesting()` enables unit-testable agents with mocked tools and in-memory repos
- `RepositoryFactory.createInMemory()` returns a complete set of test repositories in one call
- Factories serve as documentation for "how to create an agent" and "how to create repositories"

### Negative
- Must update factory when adding new tools or repositories
- Slight indirection when debugging construction issues

### Factories

| Factory | Production Method | Test Method |
|---------|------------------|-------------|
| `AgentFactory` | `create(deps: AgentDependencies)` | `createForTesting(overrides?)` |
| `RepositoryFactory` | `create(databases: Databases)` | `createInMemory()` |
