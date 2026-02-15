# ADR-013: Strategy Pattern for Agent Categorization

| Field               | Value                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Accepted                                                                                                                         |
| **Date**            | 2026-02-09                                                                                                                       |
| **Decision Makers** | Solutions Architect                                                                                                              |
| **References**      | [AI_AGENT_ARCHITECTURE.md](../plans/AI_AGENT_ARCHITECTURE.md), [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md) |

---

## Context

The AI agent uses a 4-tier certainty escalation to categorize expenses:

1. Vendor Cache (instant, zero tokens)
2. LLM Category Matching (reasons over user categories)
3. Web Search (Brave Search for unknown vendors)
4. Fallback to "Other"

Each tier is a different algorithm with different costs and latencies. We need a clean way to chain these tiers without a massive if/else tree.

---

## Decision

**Model the 4-tier escalation as a Strategy pattern with a chain-of-responsibility execution.**

---

## Options Considered

### Option A: Strategy Pattern with Chain — **CHOSEN**

**Pros:**

- Each strategy is an independent, testable class
- New strategies can be added without modifying existing ones (Open/Closed)
- Chain order is configurable — can reorder or skip strategies
- Each strategy returns `CategoryMatch | null` — null means "try the next one"
- Clean separation between "how to categorize" and "in what order"

**Cons:**

- More classes than a simple if/else
- Chain execution has overhead (one await per strategy, even if early return)

### Option B: If/else chain in agent graph

**Pros:**

- Simple, all logic in one function
- Easy to understand for new developers

**Cons:**

- One massive function with 4 branches
- Hard to test individual tiers in isolation
- Adding a new tier requires modifying existing code

---

## Consequences

### Positive

- Each tier is unit-testable: `VendorCacheStrategy.resolve(context)` can be tested independently
- V2 can add new strategies (e.g., `SpendingPatternStrategy` for recurring expense detection) without touching existing code
- Logging/observability: each strategy logs its name when it resolves, making debugging trivial

### Negative

- Slight over-engineering for 4 strategies (acceptable given testability benefits)

### Strategy Chain

```
[VendorCacheStrategy] → [Mem0MemoryStrategy] → [LLMCategoryMatchStrategy] → [BraveSearchStrategy] → [FallbackOtherStrategy]
```

---

## Cross-Reference: Comparative Validation (2026-02-14)

A comparative analysis of two production backends identified Strategy as **"essential for AI backends"** with two distinct applications:

### 1. Categorization Strategy (Current — V1) ✅

Aura's 5-tier certainty escalation is exactly the pattern the report recommends. The `CategorizationChain` resolves vendors through progressively more expensive strategies (cache → memory → LLM → search → fallback), which is the textbook use of Strategy + Chain of Responsibility for AI workflows.

### 2. LLM Provider Strategy (Future — V2 Consideration) ⏳

The report recommends Strategy for **swapping between LLM providers** (OpenAI, Anthropic, local models):

```typescript
// V2 consideration — NOT implemented in V1
interface LLMEngine {
  name: string;
  generate(prompt: string, options: LLMOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T>;
}

class OpenAIEngine implements LLMEngine { ... }
class AnthropicEngine implements LLMEngine { ... }
```

**Why NOT in V1:**

- Aura uses GPT-5.1 exclusively. The LangGraph agent is tightly integrated with OpenAI's function calling API.
- Adding an `LLMEngine` abstraction before knowing the second provider's API shape risks a leaky abstraction (OpenAI's function calling, Anthropic's tool use, and local model APIs have fundamentally different capabilities).
- **YAGNI** — You Aren't Gonna Need It. If V2 adds Anthropic support, the Strategy interface can be extracted at that point with full knowledge of both APIs.

**When to adopt:** If any of the following occur, extract an `LLMEngine` Strategy:

- A second model provider is needed (cost optimization, capability comparison)
- OpenAI experiences reliability issues requiring automatic failover
- Local model deployment (Ollama/vLLM) is added for privacy-sensitive users

### 3. Skepticism on Report's Reasoning

The report claims Strategy is essential because _"you'll swap between models frequently."_ This assumes a multi-model future that may never materialize for a single-user expense agent. The Strategy pattern is justified in Aura for **categorization tiers** (a present, validated need) — not for speculative model provider diversity.
