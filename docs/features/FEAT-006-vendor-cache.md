# FEAT-006 — Vendor Cache (Agent Memory)

> **Status:** � Done  
> **Execution Order:** 5 of 13  
> **Sprint:** 2 — Data Layer  
> **Blocked By:** FEAT-003, FEAT-002  
> **Priority:** P1 (High)  
> **Estimate:** 0.5 days  
> **Assignee:** —  
> **Completed:** 2026-02-14

---

## Summary

Implement the vendor cache system that maps normalized vendor names to categories per user. This acts as cross-invocation memory for the agent, enabling instant categorization for repeat vendors without LLM calls.

## User Stories

- **US-2:** "As a user, I want the AI to categorize my expenses with high certainty, using web search as a fallback when the vendor is ambiguous."
- Implicit: "Once the AI learns a vendor → category mapping, it should never need to re-learn it."

## Acceptance Criteria

- [x] Vendor names are normalized before cache lookup (uppercase, trim, collapse spaces, remove trailing punctuation)
- [x] Cache lookup is per-user (user A's mappings don't affect user B)
- [x] Cache hit returns `{ categoryId, confidence: "high" }` and increments `hit_count`
- [x] Cache miss returns `null` (triggers agent invocation)
- [ ] Cache is updated after agent successfully categorizes a new vendor _(Sprint 3: FEAT-005)_
- [x] Re-categorizing a transaction updates the vendor cache entry
- [x] Deleting a category cascades: all vendor cache entries for that category are removed
- [x] `hit_count` tracks how many times a vendor → category mapping has been used

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

- [x] All acceptance criteria pass
- [x] Unit tests: vendor name normalization (13 tests — exceeds plan's 5)
- [x] Unit tests: `InMemoryVendorCacheRepository` (11 tests — exceeds plan's 7)
- [ ] Integration test: Webhook with cached vendor skips agent _(Sprint 3: FEAT-004/005)_
- [x] Integration test: Re-categorize updates cache (category-cascade.test.ts)
- [x] No TypeScript errors

## References

- [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md) — `vendor_cache` table
- [AI_AGENT_ARCHITECTURE.md](../plans/AI_AGENT_ARCHITECTURE.md) — Vendor cache in agent flow
- [ADR-014](../ADR/ADR-014-vendor-cache.md) — Vendor cache decision
- [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md) — Repository implementations
- Test fixtures: `vendor-cache.json`
