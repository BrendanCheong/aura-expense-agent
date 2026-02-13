# ADR-003: LangGraph.js + LangChain.js for AI Agent

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-09 |
| **Decision Makers** | Solutions Architect |
| **References** | [AI_AGENT_ARCHITECTURE.md](../plans/AI_AGENT_ARCHITECTURE.md), [PLAN.md](../plans/PLAN.md), [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md) |

---

## Context

Aura needs an AI agent that:
1. Extracts structured data (vendor, amount, date) from raw bank email text
2. Categorizes the expense using the user's custom categories
3. Falls back to web search when uncertain
4. Logs the result to the database
5. Maintains a vendor cache for cross-invocation memory

The agent must be callable directly from Next.js API routes (TypeScript runtime).

---

## Decision

**Use LangGraph.js with LangChain.js and the ReAct pattern for the expense extraction and categorization agent.**

---

## Options Considered

### Option A: LangGraph.js + LangChain.js (ReAct) — **CHOSEN**

**Pros:**
- **Same language as the app** — TypeScript end-to-end, no cross-language bridge
- **Direct function call** — Agent is invoked as `await agent.invoke(params)` inside API routes, zero network overhead
- **ReAct pattern** — Agent reasons about what tool to call next, naturally maps to the 4-tier escalation
- **Stateful graph** — LangGraph's state machine models the `extract → categorize → search → log` flow cleanly
- **Tool abstraction** — Tools are composable, testable units with Zod schemas
- **Built-in persistence** — `MemorySaver` checkpointer for testing, can add durable checkpointing in V2
- **LangSmith integration** — Free-tier tracing for debugging agent decisions in production
- **Recommended structure** — LangGraph.js docs specify a clear `src/agent.ts` + `src/utils/tools.ts` + `src/utils/state.ts` layout

**Cons:**
- LangGraph.js is less mature than the Python version — fewer community examples
- Dependency footprint: `@langchain/core`, `@langchain/openai`, `@langchain/langgraph`, `@langchain/community`
- Agent behavior can be non-deterministic — same email might produce different tool sequences
- Cold start time: loading the agent graph adds ~500ms on first invocation

### Option B: Direct OpenAI Function Calling (no framework)

**Pros:**
- Minimal dependencies — just `openai` SDK
- Full control over prompt engineering and tool dispatch
- Simpler debugging — no framework abstraction layers

**Cons:**
- Must manually implement the tool loop (call LLM → parse tool call → execute → feed back)
- No built-in state management — must manually track agent state across tool calls
- No built-in retry/error handling for tool failures
- Harder to test — no graph structure to isolate individual nodes
- Reinventing what LangGraph already provides

### Option C: Python LangGraph (separate microservice)

**Pros:**
- More mature ecosystem — more examples, more community support
- Python ML ecosystem if we need custom models later

**Cons:**
- Requires a separate Python microservice (FastAPI/Flask)
- HTTP bridge between Next.js and Python — adds latency, error surfaces
- Two languages to maintain — TypeScript + Python
- Deployment complexity — two containers or two serverless functions
- Must serialize/deserialize email content and agent results across the bridge

### Option D: Vercel AI SDK (ai package)

**Pros:**
- Native Vercel integration — streaming, edge runtime
- Simple `generateText()` and `streamText()` APIs
- Built-in tool support

**Cons:**
- Less control over multi-step agent workflows
- No built-in state machine or graph structure
- Limited to single-turn or simple multi-turn interactions
- Tool routing logic must be hand-coded

---

## Consequences

### Positive
- Unified TypeScript codebase — agent shares types with API routes and frontend
- Agent is a direct function call — no HTTP overhead, no serialization
- LangGraph's graph structure maps cleanly to the 4-tier escalation pattern
- Individual agent nodes are testable in isolation (per LangGraph.js test docs)
- LangSmith tracing provides free observability for debugging categorization issues

### Negative
- Team must learn LangGraph.js concepts (StateGraph, Annotation, ToolNode, conditional edges)
- Agent non-determinism requires robust testing with expected ranges rather than exact outputs
- LangGraph.js updates may introduce breaking changes (pin to stable version)

### Risks
- **LangGraph.js instability:** Pin to a specific `@langchain/langgraph` version. If a breaking update occurs, the agent can be replaced with direct OpenAI function calling (Option B) since the tool schemas are the same.
- **Non-deterministic agent behavior:** Mitigated by `temperature: 0`, vendor cache (bypasses agent for known vendors), and integration tests with realistic bank email samples.

---

## Testing Approach

Per the [LangGraph.js testing documentation](https://docs.langchain.com/oss/javascript/langgraph/test):
1. **Create graph before each test** with `createGraph()` pattern
2. **Compile with `MemorySaver`** for stateful test scenarios
3. **Test individual nodes** via `graph.nodes['node_name'].invoke()`
4. **Test partial execution** via `updateState()` + `interruptBefore`/`interruptAfter`
