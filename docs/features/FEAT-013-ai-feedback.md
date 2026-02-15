# FEAT-013 — AI Feedback & Correction Flow

> **Status:** 🔴 Not Started  
> **Execution Order:** 11 of 13  
> **Sprint:** 5 — Intelligence Layer  
> **Blocked By:** FEAT-008, FEAT-005, FEAT-006  
> **Priority:** P0 (Blocker)  
> **Estimate:** 2.5 days  
> **Assignee:** —

---

## Summary

Implement a conversational feedback system on the `/transactions` page that allows users to correct AI categorization mistakes and teach the agent their preferences. When a user provides feedback on a mis-categorized transaction, the AI agent reads the feedback, proposes a new category with reasoning, and — upon approval — re-categorizes the transaction and stores the feedback in Mem0 as long-term memory.

## User Stories

- **US-8:** "As a user, I want to give feedback when the AI categorizes a transaction incorrectly, so it learns my preferences over time."
- **US-9:** "As a user, I want the AI to explain its categorization reasoning so I understand why it made that choice."
- **US-10:** "As a user, I want the AI to remember my corrections so it never makes the same mistake twice."

## Acceptance Criteria

### Feedback Modal Flow

- [ ] Transaction row in `/transactions` has a feedback icon (💬) visible on hover / always on mobile
- [ ] Clicking feedback icon opens a **Feedback Sheet** (half-modal)
- [ ] Sheet shows: current transaction details (vendor, amount, date), current category, confidence level
- [ ] "This categorization is wrong" → text area appears: "Tell the AI why this is wrong and what category it should be"
- [ ] User types feedback (e.g., "DigitalOcean is a server cost, should be Bills & Utilities")
- [ ] Submit sends feedback + transaction context to the AI agent
- [ ] Agent processes feedback and returns:
  - Proposed new category
  - Reasoning explanation (e.g., "I'll categorize DIGITALOCEAN.COM as Bills & Utilities because it's a cloud infrastructure subscription based on your feedback")
- [ ] User sees the agent's response with **[Approve]** and **[Reject & Refine]** buttons
- [ ] **Approve:**
  - Transaction category updated
  - Vendor cache updated (future transactions auto-categorized)
  - Feedback + reasoning stored in Mem0 as long-term memory
  - Success toast: "Category updated. I'll remember this for next time."
- [ ] **Reject & Refine:**
  - Feedback text area reappears with previous feedback pre-filled
  - User refines their instruction
  - Agent processes again (loop)
  - Maximum 3 rounds before hard fallback to manual category picker

### Quick Re-Categorize (Without Feedback)

- [ ] Transaction detail sheet has a category dropdown
- [ ] Changing the dropdown immediately re-categorizes (no AI involvement)
- [ ] Vendor cache is updated
- [ ] This is the "fast path" — no feedback, no Mem0, just a direct correction

### Transaction CRUD

- [ ] **Create:** "Add Transaction" button opens quick-add sheet
  - Vendor (autocomplete from vendor cache), Amount, Category, Date (default today), Notes (optional)
  - Source always "manual", confidence always "high"
- [ ] **Read:** Transaction table with pagination, filters (category, date, source, confidence)
- [ ] **Update:** Click transaction row → detail sheet → editable fields (category, vendor, amount, date, notes)
  - Updating category triggers vendor cache update
  - Feedback is optional — available as a separate action
- [ ] **Delete:** Delete button in detail sheet → confirmation dialog → undo toast (8s)

### Agent Memory (Mem0)

- [ ] Mem0 client initialized with user's namespace (`user_id`)
- [ ] On feedback approval: `mem0.add(feedbackText + agentReasoning, { user_id })`
- [ ] During categorization: `mem0.search(vendorContext, { user_id })` returns relevant past feedback
- [ ] Agent system prompt includes relevant memories as context
- [ ] Categorization chain becomes 5-tier: Vendor Cache → Mem0 Memory → LLM Match → Brave Search → Fallback "Other"

## Technical Details

### Files to Create/Modify

| File                                                    | Purpose                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| `src/components/transactions/feedback-sheet.tsx`        | **NEW** — Feedback modal UI                                 |
| `src/components/transactions/feedback-conversation.tsx` | **NEW** — Agent response + approve/reject                   |
| `src/app/api/feedback/route.ts`                         | **NEW** — Feedback processing API route                     |
| `src/lib/services/feedback.service.ts`                  | **NEW** — Feedback → Agent → Mem0 pipeline                  |
| `src/lib/mem0/client.ts`                                | **NEW** — Mem0 client singleton                             |
| `src/lib/agent/tools/recall-memories.ts`                | **NEW** — Tool to query Mem0 during categorization          |
| `src/lib/agent/graph.ts`                                | **MODIFY** — Add Mem0 memory recall to categorization chain |
| `src/lib/agent/prompts.ts`                              | **MODIFY** — Add memory context to system prompt            |
| `src/components/transactions/transaction-sheet.tsx`     | **MODIFY** — Add feedback button + category dropdown        |
| `src/components/transactions/add-transaction-sheet.tsx` | **MODIFY** — Full create form                               |

### Feedback API Route

```typescript
// POST /api/feedback
{
  "transactionId": "tx-001",
  "feedbackText": "DigitalOcean is a server cost, should be Bills",
  "currentCategoryId": "cat-other",
}

// Response
{
  "proposedCategoryId": "cat-bills",
  "proposedCategoryName": "Bills & Utilities",
  "reasoning": "I'll categorize DIGITALOCEAN.COM as Bills & Utilities because it's a cloud infrastructure subscription. Based on your feedback, hosting and server costs should go under Bills.",
  "confidence": "high"
}
```

### Feedback Sheet Wireframe

```
┌──────────────────────────────────────────┐
│  Correct This Transaction          [✕]   │
│                                          │
│  DIGITALOCEAN.COM         $16.23         │
│  08 Feb 2026 · Bills & Utilities · 🟡    │
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│  What should the category be?            │
│  ┌──────────────────────────────────┐    │
│  │ DigitalOcean is my cloud server  │    │
│  │ hosting cost. It should be under │    │
│  │ Bills & Utilities, not Other.    │    │
│  └──────────────────────────────────┘    │
│                                          │
│                      [Send to AI →]      │
│                                          │
│  ─── AI Response ────────────────────    │
│                                          │
│  🤖 "I'll categorize DIGITALOCEAN.COM   │
│  as **Bills & Utilities** because it's   │
│  a cloud hosting subscription. I'll      │
│  remember this for future transactions   │
│  from this vendor."                      │
│                                          │
│  [✅ Approve]    [🔄 Reject & Refine]   │
│                                          │
└──────────────────────────────────────────┘
```

### Mem0 Integration

```typescript
// src/lib/mem0/client.ts
import MemoryClient from 'mem0ai';

let mem0Client: MemoryClient | null = null;

export function getMem0Client(): MemoryClient {
  if (!mem0Client) {
    mem0Client = new MemoryClient({ apiKey: process.env.MEM0_API_KEY! });
  }
  return mem0Client;
}

// Store feedback
await mem0Client.add(
  `User corrected ${vendor} from ${oldCategory} to ${newCategory}. ` +
    `Reason: ${feedbackText}. ` +
    `Agent reasoning: ${agentReasoning}`,
  { user_id: userId }
);

// Recall during categorization
const memories = await mem0Client.search(`How should I categorize ${vendor}?`, {
  user_id: userId,
  limit: 3,
});
```

### 5-Tier Categorization Chain (Updated)

```
Tier 1: Vendor Cache (exact match)       → confidence: "high"
Tier 2: Mem0 Memory (semantic recall)     → confidence: "high"
Tier 3: LLM Category Match               → confidence: "medium"
Tier 4: Brave Search (web lookup)         → confidence: "medium"
Tier 5: Fallback to "Other"              → confidence: "low"
```

### Design Patterns

- **Service Layer:** `FeedbackService.processFeedback()` — [ADR-008](../ADR/ADR-008-service-layer-pattern.md)
- **Strategy Pattern:** New `Mem0MemoryStrategy` as Tier 2 — [ADR-013](../ADR/ADR-013-strategy-pattern.md)
- **Agent Memory:** Mem0 for semantic memory — [ADR-015](../ADR/ADR-015-mem0-feedback-memory.md)

## Definition of Done

- [ ] Feedback sheet opens from transaction row
- [ ] Agent processes feedback and returns category + reasoning
- [ ] Approve flow: transaction updated + vendor cache updated + Mem0 memory stored
- [ ] Reject & refine flow works for up to 3 rounds
- [ ] Quick re-categorize (dropdown) works without feedback
- [ ] Full CRUD: create, read (paginated), update, delete transactions
- [ ] Delete has undo toast (8s)
- [ ] Mem0 memories are recalled during future categorization
- [ ] Unit tests: `FeedbackService` (mock Mem0 + mock agent)
- [ ] Unit tests: `Mem0MemoryStrategy` in categorization chain
- [ ] Integration test: Feedback → Mem0 → Future categorization uses memory
- [ ] E2E test: Feedback flow (Playwright)
- [ ] No TypeScript errors

## References

- [UX_DECISIONS.md](../plans/UX_DECISIONS.md) — Section: AI Feedback Flow
- [AI_AGENT_ARCHITECTURE.md](../plans/AI_AGENT_ARCHITECTURE.md) — 5-tier categorization chain
- [ADR-015](../ADR/ADR-015-mem0-feedback-memory.md) — Mem0 decision
- [ADR-013](../ADR/ADR-013-strategy-pattern.md) — Strategy pattern + new Mem0 tier
- [ADR-014](../ADR/ADR-014-vendor-cache.md) — Vendor cache (still Tier 1 fast path)
- [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md) — FeedbackService pattern
- [DESIGN.md](../plans/DESIGN.md) — Feedback sheet styling, aurora shimmer on correction
