# ADR-004: Brave Search via Smithery.ai MCP Registry

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-09 |
| **Decision Makers** | Solutions Architect |
| **References** | [AI_AGENT_ARCHITECTURE.md](../plans/AI_AGENT_ARCHITECTURE.md), [PLAN.md](../plans/PLAN.md) |

---

## Context

The AI agent needs a web search fallback when it cannot categorize a vendor from local context alone. This is the "Tier 3" in the 4-tier certainty escalation. The search must:
- Return structured results (title, description, URL)
- Be cost-effective (< 100 queries/month expected)
- Have reliable uptime
- Be accessible from a TypeScript serverless runtime

---

## Decision

**Use Brave Search API accessed via the Smithery.ai MCP registry at `https://server.smithery.ai/brave`.**

For V1, we call the Brave Search REST API directly. For V2, we may switch to the full MCP client via the Smithery registry.

---

## Options Considered

### Option A: Brave Search via Smithery.ai MCP — **CHOSEN**

**Pros:**
- **Cheapest web search API** — 2,000 free queries/month, then $0.003/query
- **Smithery.ai MCP registry** provides a standardized interface at `https://server.smithery.ai/brave`
- **Multiple tools available** via MCP: `brave_web_search`, `brave_local_search`, `brave_news_search`, `brave_image_search`, `brave_video_search`
- **Performance:** ~1.9s latency, 98.1% uptime (Smithery.ai metrics)
- **Repository:** `brave/brave-search-mcp-server` — maintained by Brave Software
- **MCP standardization** — future-proof for MCP ecosystem integration
- Expected usage (< 50 queries/month after cache warm-up) fits well within free tier
- Clean JSON response with titles, descriptions, and URLs

**Cons:**
- Brave Search has a smaller index than Google
- MCP client SDK adds a dependency (V2 only — V1 uses direct REST)
- Smithery.ai is an intermediary — adds a potential point of failure
- 1.9s latency per search adds to agent response time

### Option B: Tavily Search

**Pros:**
- Purpose-built for AI agents — returns clean, pre-processed results
- LangChain has a native Tavily integration
- Good result quality for AI-related queries

**Cons:**
- **More expensive** — $0.01/query vs $0.003/query for Brave
- Smaller free tier (1,000 queries/month)
- Less well-known — smaller community
- Not available as MCP server

### Option C: Google Custom Search API

**Pros:**
- Best search index — most comprehensive results
- Google Knowledge Graph for entity resolution

**Cons:**
- **Expensive** — $5 per 1,000 queries after 100 free queries/day
- Requires setting up a Custom Search Engine (CSE)
- Returns HTML-heavy results — more parsing needed
- Google API quotas and rate limiting

### Option D: SerpAPI

**Pros:**
- Aggregates Google, Bing, and other search engines
- Clean structured JSON responses
- Good for scraping search results

**Cons:**
- **Most expensive** — $50/month for 5,000 queries
- Proxy-based — Google may block or degrade results
- Overkill for vendor identification queries

### Option E: No Web Search (LLM knowledge only)

**Pros:**
- Zero additional cost
- Zero additional latency
- No external dependency

**Cons:**
- GPT's knowledge has a cutoff — may not know new Singapore merchants
- Would increase "Other" categorizations for niche vendors
- No way to resolve unknown vendors like "CIRCLES.LIFE" or "BOON TONG KEE"

---

## Consequences

### Positive
- Free tier covers 40x the expected monthly usage
- Agent can resolve unknown Singapore-specific vendors (hawker centres, local businesses)
- MCP standardization positions the project for V2 MCP ecosystem integration
- Web search is a "nice-to-have" — agent still functions if Brave is down

### Negative
- 1.9s additional latency when web search is triggered (< 5% of transactions after cache warm-up)
- Brave's smaller index may miss some very niche vendors
- Dependency on Brave API key management

### Risks
- **Brave API downtime:** Agent falls through to "Other" category with `confidence: "low"`. Not critical — user can manually re-categorize.
- **Brave Search deprecation:** Straightforward to swap to Tavily or Google Custom Search. Tool interface is abstracted behind `braveSearchTool`.
