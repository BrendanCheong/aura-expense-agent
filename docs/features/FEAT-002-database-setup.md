# FEAT-002 — Appwrite Database Schema & Setup

> **Status:** 🔴 Not Started  
> **Execution Order:** 2 of 13  
> **Sprint:** 1 — Foundation  
> **Blocked By:** FEAT-003  
> **Priority:** P0 (Blocker)  
> **Estimate:** 0.5 days  
> **Assignee:** —

---

## Summary

Create the Appwrite Cloud database with all 5 collections (users, categories, transactions, budgets, vendor_cache), their attributes, and indexes. Provide a setup script and a seed script for test data.

## Acceptance Criteria

- [ ] Appwrite project created with database named `aura`
- [ ] 5 collections created with all attributes per [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md)
- [ ] All indexes created (unique `resend_email_id`, composite `user+vendor` on vendor_cache, etc.)
- [ ] `scripts/setup-appwrite.ts` creates all collections idempotently
- [ ] `scripts/seed-db.ts` populates test data (30 transactions, 7 categories, budgets, vendor cache)
- [ ] `.env.example` contains all required Appwrite env vars
- [ ] `src/lib/appwrite/config.ts` exports typed database/collection IDs

## Technical Details

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `scripts/setup-appwrite.ts` | Create collections, attributes, indexes |
| `scripts/seed-db.ts` | Seed mock data for development |
| `src/lib/appwrite/config.ts` | Database and collection ID constants |
| `.env.example` | Template env vars |

### Collections

| Collection | Key Attributes | Key Indexes |
|------------|---------------|-------------|
| `users` | name, email, avatar_url, provider, inbound_email, monthly_salary, budget_mode | unique(email), unique(inbound_email) |
| `categories` | user_id, name, emoji, color, description, sort_order, is_system | composite(user_id, name) |
| `transactions` | user_id, category_id, vendor, amount, currency, date, source, confidence, resend_email_id, raw_email_subject | unique(resend_email_id), index(user_id, date) |
| `budgets` | user_id, category_id, year, month, amount | composite(user_id, category_id, year, month) |
| `vendor_cache` | user_id, vendor_name, category_id, hit_count | composite(user_id, vendor_name) |

## Definition of Done

- [ ] `scripts/setup-appwrite.ts` runs without errors against a fresh Appwrite project
- [ ] `scripts/seed-db.ts` populates verifiable test data
- [ ] All 5 collections visible in Appwrite Console with correct attributes
- [ ] Config file exports typed constants matching collection IDs
- [ ] No TypeScript errors

## References

- [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md) — Full schema reference
- [ADR-002](../ADR/ADR-002-appwrite-backend.md) — Appwrite decision
- [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md) — Repository interfaces match schema
