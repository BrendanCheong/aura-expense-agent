# ADR-014: Vendor Cache Pattern (Agent Memory)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-09 |
| **Decision Makers** | Solutions Architect |
| **References** | [AI_AGENT_ARCHITECTURE.md](../plans/AI_AGENT_ARCHITECTURE.md), [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md) |

---

## Context

Most users transact at the same vendors repeatedly (Grab, Netflix, Starbucks, etc.). Re-invoking the LLM agent for every known vendor wastes tokens and adds latency. We need a cross-invocation memory mechanism that short-circuits the agent for repeat vendors.

---

## Decision

**Use a simple Appwrite table (`vendor_cache`) to map normalized vendor names to category IDs. Check this cache before invoking the agent.**

---

## Options Considered

### Option A: Vendor Cache table in Appwrite — **CHOSEN**

**Pros:**
- **Zero additional cost** — uses existing Appwrite database
- **Zero additional infrastructure** — no separate memory service
- **Simple schema** — `user_id` + `vendor_name` + `category_id` + `hit_count`
- **Fast path** — cache check is a single indexed query (~5ms) vs agent invocation (~3-5s)
- **Hit count tracking** — analytics on most frequent vendors
- **Per-user** — each user has their own vendor→category mappings
- **Self-correcting** — when a user re-categorizes a transaction, the vendor cache is updated

**Cons:**
- Static mapping — doesn't learn spending patterns or time-based categorization
- Requires exact vendor name match (normalized uppercase) — "GRAB *GRABFOOD" ≠ "GRABFOOD"
- No semantic similarity — can't match "STARBUCKS VIVOCITY" to "STARBUCKS ION" without normalization logic

### Option B: mem0 (external agent memory)

**Pros:**
- Richer memory — can store user preferences, spending patterns, conversation context
- Semantic memory — can match similar vendor names
- Purpose-built for AI agent memory

**Cons:**
- External API dependency — adds latency and cost
- Monthly subscription for cloud version
- Overkill for simple vendor→category mapping
- Adds complexity for a V1 feature

### Option C: In-process cache (Map/LRU)

**Pros:**
- Zero-latency lookups
- No database queries

**Cons:**
- Serverless runtime — cache is lost on every cold start
- Not shared across function instances
- Not persistent across deployments

---

## Consequences

### Positive
- After ~20-30 transactions (1-2 months of typical usage), ~70% of emails hit the cache
- Agent invocation drops from 100% of transactions to ~30% after warm-up
- Token costs drop proportionally: ~$0.19/month → ~$0.06/month at scale
- Cache is transparent — user doesn't see it, but experiences faster processing

### Negative
- First transaction for each new vendor always goes through the full agent pipeline
- Vendor name variations (location-specific suffixes like "STARBUCKS VIVOCITY" vs "STARBUCKS BEDOK") create separate cache entries
  - **Mitigation:** V2 can add fuzzy matching via substring comparison or Levenshtein distance
