# FEAT-008 — Transaction List & Management

> **Status:** 🔴 Not Started  
> **Execution Order:** 8 of 13  
> **Sprint:** 4 — UI Pages  
> **Blocked By:** FEAT-001, FEAT-010, FEAT-006  
> **Priority:** P0 (Blocker)  
> **Estimate:** 1.5 days  
> **Assignee:** —

---

## Summary

Build the transactions page with a filterable, paginated table. Users can view all transactions, add manual ones, edit any field, re-categorize, provide AI feedback on miscategorized transactions, and delete. Re-categorizing a transaction updates the vendor cache. AI feedback corrections are stored in Mem0 for future recall.

## User Stories

- **US-1:** Expenses auto-logged from email
- **US-2:** AI categorizes with 5-tier certainty escalation
- **US-8:** User corrects AI categorization via conversational feedback
- **US-9:** AI remembers corrections for future categorizations
- **US-10:** Full CRUD over transactions including manual entry

## Acceptance Criteria

- [ ] `/transactions` shows all transactions in a paginated table (desktop) or card list (mobile)
- [ ] Table columns: Date, Vendor, Category (badge), Amount, Confidence (dot)
- [ ] Confidence dots: 🟢 high, 🟡 medium, 🔴 low — with tooltips
- [ ] Filters: Category dropdown, Date range picker, Source (email/manual)
- [ ] Pagination: 20 per page, page navigation at bottom
- [ ] "Add Transaction" button opens quick-add sheet
- [ ] Quick add: Vendor (autocomplete from cache), Amount, Category, Date (default today)
- [ ] Click transaction row → detail sheet slides in
- [ ] Detail sheet shows all editable fields: Vendor, Amount, Category, Date, Description
- [ ] Detail sheet shows read-only: Source (email/manual), Confidence (dot), Email Subject (if email-sourced)
- [ ] "Give AI Feedback" button in detail sheet opens feedback conversation flow (see FEAT-013)
- [ ] Category dropdown in detail sheet is editable → saves immediately (quick re-categorize path)
- [ ] Changing category updates vendor cache for future auto-categorization
- [ ] "Save" button for multi-field edits (vendor, amount, date, description)
- [ ] Delete button with confirmation → undo toast (8s)
- [ ] Quick Add sheet: Vendor (autocomplete from cache), Amount, Category, Date (default today), Description
- [ ] Empty state when no transactions match filters

## Technical Details

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/transactions/page.tsx` | Transactions page |
| `src/components/transactions/transaction-table.tsx` | Data table (desktop) |
| `src/components/transactions/transaction-card.tsx` | Card list (mobile) |
| `src/components/transactions/transaction-sheet.tsx` | Detail sheet (full CRUD) |
| `src/components/transactions/add-transaction-sheet.tsx` | Quick add sheet |
| `src/components/transactions/transaction-filters.tsx` | Filter controls |
| `src/components/feedback/feedback-sheet.tsx` | AI feedback conversation (shared from FEAT-013) |
| `src/hooks/use-transactions.ts` | Data fetching hook |

### API Routes Used

- `GET /api/transactions` — List with pagination & filters
- `POST /api/transactions` — Create manual transaction
- `PATCH /api/transactions/[id]` — Update (any field: category, vendor, amount, date, description)
- `DELETE /api/transactions/[id]` — Delete
- `POST /api/feedback` — Process AI feedback (see FEAT-013)

## Definition of Done

- [ ] All acceptance criteria pass in browser
- [ ] Unit tests: `TransactionService` (18 tests per `03-services.test-plan.md`)
- [ ] E2E test: Transaction list, add, edit, delete (Playwright)
- [ ] Responsive: Table → card layout at mobile breakpoint
- [ ] Accessible: Keyboard navigable table, ARIA labels on actions
- [ ] No TypeScript errors

## References

- [FRONTEND_ARCHITECTURE.md](../plans/FRONTEND_ARCHITECTURE.md) — Transactions wireframe
- [UX_DECISIONS.md](../plans/UX_DECISIONS.md) — Transaction UX, confidence indicators, feedback flow, sheet design
- [DESIGN.md](../plans/DESIGN.md) — Aurora Noir design system, component styling
- [API_SPECIFICATION.md](../plans/API_SPECIFICATION.md) — Transaction CRUD routes + feedback route
- [FEAT-013](./FEAT-013-ai-feedback.md) — AI Feedback & Correction Flow (companion feature)
- [ADR-015](../ADR/ADR-015-mem0-feedback-memory.md) — Mem0 for feedback memory
- [Testing Plan 06](../testing-plan/06-e2e.test-plan.md) — Transaction E2E tests
