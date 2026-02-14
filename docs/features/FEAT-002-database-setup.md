# FEAT-002 — Appwrite Database Schema & Setup

> **Status:** � Done  
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

- [x] Appwrite project created with database named `aura`
- [x] 5 tables created with all attributes per [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md) (TablesDB API)
- [x] All indexes created (unique `resend_email_id`, composite `user+vendor` on vendor_cache, etc.)
- [x] `scripts/setup-appwrite.ts` creates all tables idempotently via TablesDB
- [x] `scripts/seed-db.ts` populates test data (32 transactions, 8 categories, 8 budgets, 7 vendor cache)
- [x] `.env.example` contains all required Appwrite env vars
- [x] `src/lib/appwrite/config.ts` exports typed database/table IDs

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

- [x] `scripts/setup-appwrite.ts` runs without errors against a fresh Appwrite project
- [x] `scripts/seed-db.ts` populates verifiable test data
- [x] All 5 tables visible in Appwrite Console with correct attributes
- [x] Config file exports typed constants matching table IDs
- [x] No TypeScript errors
- [x] Appwrite repository implementations (4 repos) with full test coverage
- [x] RepositoryFactory.createAppwrite() wired with TablesDB
- [x] DI container createContainer() returns production services
- [x] All 123 tests passing

## References

- [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md) — Full schema reference
- [ADR-002](../ADR/ADR-002-appwrite-backend.md) — Appwrite decision
- [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md) — Repository interfaces match schema
