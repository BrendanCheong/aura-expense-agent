# ADR-002: Appwrite Cloud as Backend-as-a-Service

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-09 |
| **Decision Makers** | Solutions Architect |
| **References** | [PLAN.md](../plans/PLAN.md), [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md) |

---

## Context

Aura needs a persistent data layer for users, categories, transactions, budgets, and a vendor cache. It also needs OAuth2 authentication (Google + GitHub). The solution must:
- Have zero infrastructure management overhead
- Support CRUD operations with indexes and unique constraints
- Provide OAuth2 authentication out of the box
- Be cost-effective for a low-volume personal expense tracker

---

## Decision

**Use Appwrite Cloud (MariaDB) for database, authentication, and file storage.**

---

## Options Considered

### Option A: Appwrite Cloud — **CHOSEN**

**Pros:**
- All-in-one BaaS: Database, Auth (OAuth2), Storage, Functions, Realtime — single platform
- OAuth2 for Google + GitHub with zero custom code (`account.createOAuth2Session()`)
- MariaDB under the hood — battle-tested relational database
- Document-based API (JSON documents) maps naturally to TypeScript types
- Free tier: 75K+ document reads/month, 10GB storage — more than sufficient
- Unique index support for dedup (`resend_email_id`) and vendor cache
- Server-side SDK (`node-appwrite`) for Next.js API routes
- Appwrite Cloud is fully managed — no MariaDB administration

**Cons:**
- No SQL aggregation queries — `SUM`, `GROUP BY` must be done in-application code
- 25MB max document size (not an issue — expense records are < 1KB)
- Smaller community than Firebase/Supabase
- No direct SQL access — all queries go through the SDK/REST API
- Limited query operators compared to raw SQL

### Option B: Supabase (PostgreSQL)

**Pros:**
- Full PostgreSQL with SQL support — aggregation, views, stored procedures
- Built-in Auth with OAuth2
- Realtime subscriptions out of the box
- Larger community and more tutorials
- Row-Level Security (RLS) for data isolation

**Cons:**
- More complex setup for simple CRUD operations
- RLS policies can be error-prone
- PostgreSQL is more resource-intensive than MariaDB for simple reads
- Supabase free tier has stricter limits on edge functions

### Option C: Firebase (Firestore)

**Pros:**
- Google ecosystem — tight integration with Google Auth
- Real-time by default
- Scales automatically

**Cons:**
- NoSQL — no relational integrity, no joins, no unique indexes
- Complex pricing model based on reads/writes
- Vendor lock-in to Google Cloud
- Firestore querying is limited — no `OR` queries, no full-text search

### Option D: Self-hosted PostgreSQL (e.g., Neon, PlanetScale)

**Pros:**
- Full SQL power — aggregations, views, migrations
- Prisma/Drizzle ORM for type-safe queries
- No vendor lock-in to BaaS

**Cons:**
- Must build auth system separately (NextAuth.js, Lucia, etc.)
- Must manage connection pooling, migrations, backups
- Higher operational complexity
- Two separate systems to manage (DB + Auth)

---

## Consequences

### Positive
- Single SDK for DB + Auth — one dependency, one dashboard
- OAuth2 "just works" — no JWT management, no session table
- Free tier covers expected usage (< 100 transactions/month)
- Document model maps cleanly to TypeScript interfaces
- Unique indexes handle dedup without application-level locking

### Negative
- No SQL aggregation — dashboard `SUM(amount) GROUP BY category` must be computed in-app
  - **Mitigation:** At < 1000 transactions/month, fetching all transactions for a month and summing in TypeScript is fine (< 100ms)
- Vendor lock-in to Appwrite Cloud — migration to PostgreSQL in V2 would require rewriting the repository layer
  - **Mitigation:** Repository pattern (ADR-009) abstracts data access, making migration feasible
- No Prisma/Drizzle — type safety relies on manual TypeScript interfaces
  - **Mitigation:** Strict TypeScript types in `src/types/` with Zod validation on API boundaries

### Risks
- **Appwrite Cloud reliability:** If Appwrite has downtime, the entire app is down. Mitigated by Appwrite's SLA and the non-critical nature of expense tracking (delayed processing is acceptable).
- **Query performance at scale:** If a user accumulates 10,000+ transactions, in-app aggregation may slow down. Mitigated by date range filtering and pagination.
