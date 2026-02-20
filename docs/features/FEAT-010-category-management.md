# FEAT-010 — Category Management (CRUD)

> **Status:** � Done  
> **Execution Order:** 4 of 13  
> **Sprint:** 2 — Data Layer  
> **Blocked By:** FEAT-001, FEAT-002  
> **Priority:** P0 (Blocker) _(promoted: dependency for agent, transactions, budgets, dashboard)_  
> **Estimate:** 1 day  
> **Assignee:** —  
> **Completed:** 2026-02-14

---

## Summary

Build the category management page where users can view, create, edit, and delete expense categories. Categories include emoji, color, and a description that helps the AI agent categorize more accurately. The "Other" system category cannot be deleted.

## User Stories

- **US-7:** "As a user, I want to manage my expense categories (CRUD) with descriptions that help the AI categorize correctly."

## Acceptance Criteria

- [x] `/categories` shows all user categories in a list
- [x] Each category row shows: emoji, name, color swatch, description
- [x] "Add Category" opens a creation dialog with: name, emoji picker, color picker, description
- [x] Description field has hint: "Helps the AI agent categorize transactions correctly"
- [x] Click category row → edit via edit button + dialog
- [x] Delete button on non-system categories with confirmation
- [x] Deleting a category with transactions: transactions moved to "Other", vendor cache entries removed, budgets deleted
- [x] "Other" category has disabled delete button with tooltip explaining it's a system category
- [x] 8 default categories seeded per user on first login
- [x] Categories ordered by `sort_order` (drag-to-reorder is V2)

## Technical Details

### Files to Create/Modify

| File                                          | Purpose            |
| --------------------------------------------- | ------------------ |
| `src/app/(dashboard)/categories/page.tsx`     | Categories page    |
| `src/components/categories/CategoryList.tsx`  | Category list      |
| `src/components/categories/CategoryForm.tsx`  | Create/edit form   |
| `src/components/categories/EmojiPicker.tsx`   | Emoji selector     |
| `src/components/categories/ColorPicker.tsx`   | Color selector     |
| `src/hooks/use-categories.ts`                 | Data fetching hook |

### API Routes Used

- `GET /api/categories` — List categories
- `POST /api/categories` — Create category
- `PATCH /api/categories/[id]` — Update category
- `DELETE /api/categories/[id]` — Delete category (cascade)

### Cascade on Delete

```
Delete "Transport" →
  1. All transactions with category_id = "cat-transport" → set to "cat-other"
  2. All vendor_cache with category_id = "cat-transport" → deleted
  3. All budgets with category_id = "cat-transport" → deleted
  4. Category "Transport" → deleted
```

## Definition of Done

- [x] All acceptance criteria pass in browser
- [x] Unit tests: `CategoryService` (12 tests — exceeds plan's 9)
- [x] Integration tests: Category cascade (7 tests — exceeds plan's 4)
- [ ] E2E test: Category list, add, delete cascade (Playwright) _(deferred to FEAT-011)_
- [x] Responsive: Stacked list on mobile
- [x] No TypeScript errors

## References

- [UX_DECISIONS.md](../plans/UX_DECISIONS.md) — Section 8: Category Management UX
- [FRONTEND_ARCHITECTURE.md](../plans/FRONTEND_ARCHITECTURE.md) — Categories wireframe
- [API_SPECIFICATION.md](../plans/API_SPECIFICATION.md) — Category CRUD routes
- [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md) — `categories` table
- [Testing Plan 05](../testing-plan/05-integration.test-plan.md) — Category cascade tests
