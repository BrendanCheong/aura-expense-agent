# Test Plan 04 — AI Agent

> **Layer:** Unit Tests  
> **Runner:** Vitest  
> **Mock Data:** `__tests__/fixtures/email-samples.json`, `__tests__/fixtures/categories.json`  
> **Target Coverage:** 85%+  
> **Pattern:** Per LangGraph.js test docs — create graph before each test, compile with MemorySaver  
> **References:** [AI_AGENT_ARCHITECTURE.md](../plans/AI_AGENT_ARCHITECTURE.md), [ADR-003](../ADR/ADR-003-langgraph-agent.md), [LangGraph.js Test Docs](https://docs.langchain.com/oss/javascript/langgraph/test)

---

## Design: Agent Test Pattern

Per the LangGraph.js test documentation, agent tests follow this pattern:

```typescript
import { test, expect, vi } from 'vitest';
import { MemorySaver } from '@langchain/langgraph';
import { createExpenseAgent } from '@/lib/agent/graph';
import emailSamples from '../../fixtures/email-samples.json';
import categories from '../../fixtures/categories.json';

// Create graph before each test
const createTestGraph = () => {
  return createExpenseAgent({
    // Use mocked/test dependencies
    model: 'gpt-5.1', // Will be mocked via vi.mock
    apiKey: 'test-key',
    tools: [ /* mocked tools */ ],
  });
};

test('agent extracts expense from UOB email', async () => {
  const graph = createTestGraph();
  const checkpointer = new MemorySaver();
  const compiled = graph.compile({ checkpointer });

  const result = await compiled.invoke(
    { emailText: emailSamples.uob_bank_alert.text, ... },
    { configurable: { thread_id: '1' } }
  );

  expect(result.amount).toBe(16.23);
  expect(result.vendor).toBe('DIGITALOCEAN.COM');
});
```

---

## 1. Email Extraction (Regex Fast Path)

**File:** `__tests__/unit/agent/extract-expense.test.ts`  
**Fixtures:** `email-samples.json`

| #   | Test Name                                        | Email Sample                 | Expected                                                             |
| --- | ------------------------------------------------ | ---------------------------- | -------------------------------------------------------------------- |
| 1   | extractExpenseFromText — UOB bank alert          | `uob_bank_alert`             | `{ amount: 16.23, vendor: "DIGITALOCEAN.COM", rawDate: "08/02/26" }` |
| 2   | extractExpenseFromText — DBS bank alert          | `dbs_bank_alert`             | `{ amount: 25.50, vendor: "GRAB *GRABFOOD" }`                        |
| 3   | extractExpenseFromText — OCBC bank alert         | `ocbc_bank_alert`            | `{ amount: 89.99, vendor: "AMAZON.SG" }`                             |
| 4   | extractExpenseFromText — large amount with comma | `large_amount_comma`         | `{ amount: 1234.56, vendor: "SCOOT AIRLINES" }`                      |
| 5   | extractExpenseFromText — S$ format               | `s_dollar_format`            | `{ amount: 48.00, vendor: "SINGTEL MOBILE" }`                        |
| 6   | extractExpenseFromText — non-transaction email   | `newsletter_non_transaction` | `null`                                                               |
| 7   | extractExpenseFromText — GrabFood receipt        | `grab_receipt_html`          | Extracts total amount (18.50), not line items                        |

## 2. Brave Search Tool

**File:** `__tests__/unit/agent/brave-search.test.ts`

| #   | Test Name                            | Scenario                                      | Expected                                                   |
| --- | ------------------------------------ | --------------------------------------------- | ---------------------------------------------------------- |
| 8   | braveSearchTool — successful search  | Mock fetch returns 3 results                  | Formatted string with titles + descriptions                |
| 9   | braveSearchTool — API failure        | Mock fetch returns 500                        | Returns fallback "Search failed. Proceed with best guess." |
| 10  | braveSearchTool — empty results      | Mock fetch returns `{ web: { results: [] } }` | Returns "No results found."                                |
| 11  | braveSearchTool — rate limited (429) | Mock fetch returns 429                        | Returns fallback message                                   |

## 3. Categorization Strategy Chain

**File:** `__tests__/unit/agent/categorization-chain.test.ts`  
**Fixtures:** `categories.json`, `vendor-cache.json`

| #   | Test Name                                     | Scenario                   | Expected                                         |
| --- | --------------------------------------------- | -------------------------- | ------------------------------------------------ |
| 12  | VendorCacheStrategy — cache hit               | "GRAB \*GRABFOOD" in cache | `{ categoryId: "cat-food", confidence: "high" }` |
| 13  | VendorCacheStrategy — cache miss              | "NEW VENDOR" not in cache  | `null` (pass to next strategy)                   |
| 14  | FallbackOtherStrategy — always resolves       | Any context                | `{ categoryId: "cat-other", confidence: "low" }` |
| 15  | CategorizationChain — resolves at tier 1      | Cached vendor              | VendorCacheStrategy resolves first               |
| 16  | CategorizationChain — falls through to tier 4 | Unknown vendor, no LLM     | FallbackOtherStrategy resolves                   |
| 17  | CategorizationChain — logs strategy name      | Any resolution             | Console.log includes strategy name               |

## 4. Agent Graph (Integration-style with Mocked LLM)

**File:** `__tests__/unit/agent/agent-graph.test.ts`

Per LangGraph.js docs, test individual nodes and partial execution:

| #   | Test Name                                  | Scenario                                       | Expected                             |
| --- | ------------------------------------------ | ---------------------------------------------- | ------------------------------------ |
| 18  | agent graph — compiles without errors      | `createExpenseAgent()`                         | Returns compiled graph               |
| 19  | agent graph — individual node: extract     | Invoke `graph.nodes['agent']` with email state | Updates state with extracted data    |
| 20  | agent graph — individual node: tools       | Invoke tool node with tool call message        | Executes appropriate tool            |
| 21  | agent graph — conditional edge: tools path | Agent wants to call a tool                     | Routes to tools node                 |
| 22  | agent graph — conditional edge: end path   | Agent done (no tool calls)                     | Routes to **end**                    |
| 23  | agent graph — partial execution            | Start from extract, stop before log            | Only extraction + categorization run |

---

## Mocking Strategy

```typescript
// Mock the OpenAI API for agent tests
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    bindTools: vi.fn().mockReturnThis(),
    invoke: vi.fn().mockResolvedValue({
      content: 'Extracted: DIGITALOCEAN.COM, SGD 16.23',
      tool_calls: [
        {
          name: 'extract_expense',
          args: { emailText: '...', emailHtml: '...', emailSubject: '...', emailDate: '...' },
        },
      ],
    }),
  })),
}));

// Mock Brave Search fetch for agent tests
vi.stubGlobal(
  'fetch',
  vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      web: {
        results: [{ title: 'DigitalOcean', description: 'Cloud infrastructure provider' }],
      },
    }),
  })
);
```
