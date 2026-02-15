# Architectural Decision Records (ADR) — Index

> All architectural decisions for the Aura Expense Agent project are documented here.  
> Each ADR follows the format: Context → Decision → Options Considered → Consequences.

---

## Tech Stack Decisions

| ADR                                         | Title                                  | Status   | Summary                                                                                 |
| ------------------------------------------- | -------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| [ADR-001](ADR-001-nextjs-framework.md)      | Next.js 19 as Full-Stack Framework     | Accepted | Unified TypeScript full-stack with App Router, RSC, and native Vercel deployment        |
| [ADR-002](ADR-002-appwrite-backend.md)      | Appwrite Cloud as Backend-as-a-Service | Accepted | All-in-one BaaS: DB (MariaDB), OAuth2 Auth, zero infra management                       |
| [ADR-003](ADR-003-langgraph-agent.md)       | LangGraph.js for AI Agent              | Accepted | TypeScript-native ReAct agent with stateful graph, direct function call from API routes |
| [ADR-004](ADR-004-brave-search-smithery.md) | Brave Search via Smithery.ai MCP       | Accepted | Cheapest web search API with MCP standardization, free tier covers 40x expected usage   |
| [ADR-005](ADR-005-shadcn-ui.md)             | shadcn/ui + Tailwind CSS v4            | Accepted | Copy-paste components, zero-dependency UI, native Recharts integration                  |
| [ADR-006](ADR-006-recharts.md)              | Recharts for Data Visualization        | Accepted | Lightweight, declarative, native shadcn/ui chart wrapper                                |
| [ADR-011](ADR-011-typescript-language.md)   | TypeScript End-to-End                  | Accepted | Shared types across frontend, API, and agent; single toolchain                          |
| [ADR-012](ADR-012-resend-email.md)          | Resend for Inbound Email               | Accepted | Webhook-based email gateway with TypeScript SDK and dedup via email ID                  |

## Design Pattern Decisions

| ADR                                         | Title                               | Status   | Summary                                                                                                           |
| ------------------------------------------- | ----------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| [ADR-007](ADR-007-dependency-injection.md)  | Dependency Injection Pattern        | Accepted | Lightweight custom DI container, zero framework dependencies. Validated by cross-codebase analysis.               |
| [ADR-008](ADR-008-service-layer-pattern.md) | Service Layer Pattern               | Accepted | Business logic in 5 service classes, API routes stay thin                                                         |
| [ADR-009](ADR-009-repository-pattern.md)    | Repository Pattern                  | Accepted | Interface-based data access, Appwrite + InMemory implementations                                                  |
| [ADR-010](ADR-010-factory-pattern.md)       | Factory Pattern                     | Accepted | AgentFactory + RepositoryFactory for complex object creation                                                      |
| [ADR-013](ADR-013-strategy-pattern.md)      | Strategy Pattern for Categorization | Accepted | 5-tier certainty escalation as composable strategy chain. V2 expansion path for LLM provider swapping documented. |
| [ADR-014](ADR-014-vendor-cache.md)          | Vendor Cache Pattern                | Accepted | Appwrite table as cross-invocation agent memory, ~70% cache hit rate                                              |

## AI & Memory Decisions

| ADR                                        | Title                          | Status   | Summary                                                                                  |
| ------------------------------------------ | ------------------------------ | -------- | ---------------------------------------------------------------------------------------- |
| [ADR-015](ADR-015-mem0-feedback-memory.md) | Mem0 Cloud for Feedback Memory | Accepted | Long-term semantic memory for user corrections, free tier 1,000 memories, ~200ms latency |
