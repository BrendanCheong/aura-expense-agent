# FEAT-006 — Vendor Cache (Agent Memory)

> **Status:** 🔴 Not Started  
> **Execution Order:** 5 of 13  
> **Sprint:** 2 — Data Layer  
> **Blocked By:** FEAT-003, FEAT-002  
> **Priority:** P1 (High)  
> **Estimate:** 0.5 days  
> **Assignee:** —

---

## Summary

Implement the vendor cache system that maps normalized vendor names to categories per user. This acts as cross-invocation memory for the agent, enabling instant categorization for repeat vendors without LLM calls.

## User Stories

- **US-2:** "As a user, I want the AI to categorize my expenses with high certainty, using web search as a fallback when the vendor is ambiguous."
- Implicit: "Once the AI learns a vendor → category mapping, it should never need to re-learn it."

## Acceptance Criteria

- [ ] Vendor names are normalized before cache lookup (uppercase, trim, collapse spaces, remove trailing punctuation)
- [ ] Cache lookup is per-user (user A's mappings don't affect user B)
- [ ] Cache hit returns `{ categoryId, confidence: "high" }` and increments `hit_count`
- [ ] Cache miss returns `null` (triggers agent invocation)
- [ ] Cache is updated after agent successfully categorizes a new vendor
- [ ] Re-categorizing a transaction updates the vendor cache entry
- [ ] Deleting a category cascades: all vendor cache entries for that category are removed
- [ ] `hit_count` tracks how many times a vendor → category mapping has been used

## Technical Details

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/lib/repositories/interfaces/vendor-cache.repository.ts` | Interface |
| `src/lib/repositories/appwrite/vendor-cache.repository.ts` | Appwrite implementation |
| `src/lib/repositories/in-memory/vendor-cache.repository.ts` | Test implementation |
| `src/lib/utils/vendor.ts` | `normalizeVendorName()`, `extractRoughVendor()` |

### Normalization Rules

```typescript
function normalizeVendorName(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')     // collapse multiple spaces
    .replace(/[.]+$/, '');     // remove trailing dots
}

// "  Grab *GrabFood  " → "GRAB *GRABFOOD"
// "DIGITALOCEAN.COM."  → "DIGITALOCEAN.COM"
// "YA  KUN   KAYA TOAST" → "YA KUN KAYA TOAST"
```

### Design Patterns

- **Repository Pattern:** `IVendorCacheRepository` — [ADR-009](../ADR/ADR-009-repository-pattern.md)
- **Vendor Cache Pattern:** — [ADR-014](../ADR/ADR-014-vendor-cache.md)

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Unit tests: vendor name normalization (5 tests per `01-utils.test-plan.md`)
- [ ] Unit tests: `InMemoryVendorCacheRepository` (7 tests per `02-repositories.test-plan.md`)
- [ ] Integration test: Webhook with cached vendor skips agent
- [ ] Integration test: Re-categorize updates cache
- [ ] No TypeScript errors

## References

- [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md) — `vendor_cache` table
- [AI_AGENT_ARCHITECTURE.md](../plans/AI_AGENT_ARCHITECTURE.md) — Vendor cache in agent flow
- [ADR-014](../ADR/ADR-014-vendor-cache.md) — Vendor cache decision
- [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md) — Repository implementations
- Test fixtures: `vendor-cache.json`
