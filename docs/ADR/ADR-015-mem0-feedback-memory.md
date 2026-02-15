# ADR-015 — Mem0 for Agent Feedback Memory

> **Status:** Accepted  
> **Date:** 2026-02-13  
> **Category:** Design Pattern Decision  
> **References:** [ADR-014](ADR-014-vendor-cache.md), [AI_AGENT_ARCHITECTURE.md](../plans/AI_AGENT_ARCHITECTURE.md), [FEAT-013](../features/FEAT-013-ai-feedback.md)

---

## Context

Users need a way to correct the AI agent's categorization mistakes and teach it their preferences over time. When the agent mis-categorizes a transaction, the user should be able to provide natural-language feedback (e.g., "DIGITALOCEAN is a work expense for me, not Bills"), and the agent should remember this preference for all future transactions.

The existing vendor cache (ADR-014) handles the simple case: `vendor → category` mapping. But user feedback is richer — it includes reasoning, personal context, and nuanced preferences that a flat cache cannot capture. We need a **semantic memory layer** that the agent can query during categorization.

## Decision

We will integrate **Mem0** as the long-term semantic memory layer for the AI agent's user feedback system.

- **Mem0 Cloud** for V1 (managed, zero-ops)
- Each user has an isolated memory namespace (`user_id` as Mem0 user identifier)
- Feedback text + agent reasoning are stored as memories
- During categorization, the agent queries Mem0 for relevant memories before making a decision
- Vendor cache remains the **fast path** (Tier 1); Mem0 is the **contextual path** (Tier 2, between vendor cache and LLM general knowledge)

## Options Considered

### Option A: Mem0 Cloud ✅ (Selected)

| Aspect         | Detail                                                        |
| -------------- | ------------------------------------------------------------- |
| Implementation | `npm install mem0ai`, API key, `mem0.add()` / `mem0.search()` |
| Memory model   | Semantic search over stored memories per user                 |
| Isolation      | Built-in user-level isolation via `user_id` parameter         |
| Cost           | Free tier: 1,000 memories. Paid: $0.001/memory/month          |
| Ops burden     | Zero — managed cloud service                                  |

**Pros:**

- Purpose-built for AI agent memory
- Semantic search (not just exact match) — can find relevant feedback even with different wording
- User isolation built-in
- LangChain.js integration exists
- Scales naturally

**Cons:**

- External dependency / third-party service
- Additional API latency (~200ms per query)
- Data leaves your infrastructure

### Option B: Appwrite Table (Flat Feedback Log)

Store feedback as rows in an `ai_feedback` Appwrite table.

**Pros:** No new dependency, simple  
**Cons:** No semantic search — must do exact vendor match. Can't capture nuanced preferences like "all cloud services are work expenses." Essentially duplicates vendor cache with extra text.

### Option C: Vector Embeddings in Appwrite

Generate OpenAI embeddings for feedback text, store in Appwrite, and do cosine similarity search.

**Pros:** Semantic search without Mem0  
**Cons:** Significant implementation complexity. Appwrite doesn't support vector search natively — would need a separate vector store. Reimplements what Mem0 provides out of the box.

### Option D: Defer to V2

Keep vendor cache only. No feedback memory beyond simple re-categorization.

**Pros:** Simplest V1  
**Cons:** Users cannot teach the AI nuanced preferences. Every correction is a one-off fix, not a learning moment.

## Consequences

### Positive

- Agent becomes smarter over time per user — genuinely learns preferences
- Feedback loop creates trust ("the AI gets better when I correct it")
- Semantic memory enables nuanced rules ("all cloud/hosting → Bills for me")
- 5-tier categorization chain: Vendor Cache → Mem0 → LLM Match → Brave Search → Fallback
- Relatively simple integration (~50 lines of code)

### Negative

- Another external service to depend on / manage API keys for
- ~200ms added latency to the categorization pipeline (Mem0 search)
- Free tier limit of 1,000 memories (sufficient for V1 single-user)
- Feedback conversation adds UI complexity

### Migration Path

If Mem0 Cloud becomes unsuitable, memories can be exported and migrated to:

- Self-hosted Mem0 (open-source)
- Appwrite table + OpenAI embeddings
- Any vector database (Pinecone, Weaviate, etc.)
