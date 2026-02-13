# FEAT-001 — OAuth Authentication (Google + GitHub)

> **Status:** 🔴 Not Started  
> **Execution Order:** 3 of 13  
> **Sprint:** 1 — Foundation  
> **Blocked By:** FEAT-003, FEAT-002  
> **Priority:** P0 (Blocker)  
> **Estimate:** 1 day  
> **Assignee:** —

---

## Summary

Implement user authentication via Appwrite OAuth2 with Google and GitHub providers. Users should be able to sign in, sign out, and have their session persist across page reloads.

## User Stories

- **US-6:** "As a user, I want to sign in with Google or GitHub via OAuth2."

## Acceptance Criteria

- [ ] Landing page (`/`) displays "Sign in with Google" and "Sign in with GitHub" buttons
- [ ] Clicking a button redirects to the OAuth provider
- [ ] Successful auth redirects to `/dashboard`
- [ ] Failed auth redirects back to `/` with an error toast
- [ ] Unauthenticated access to `/dashboard`, `/transactions`, `/categories`, `/budgets`, `/settings` redirects to `/`
- [ ] User profile is created in the `users` Appwrite table on first login
- [ ] 7 default categories are seeded for new users
- [ ] User avatar and name are displayed in the sidebar
- [ ] "Sign Out" button clears session and redirects to `/`
- [ ] Session persists across browser refresh (Appwrite session cookie)

## Technical Details

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/app/(auth)/login/page.tsx` | Login page with OAuth buttons |
| `src/app/(auth)/callback/page.tsx` | OAuth redirect handler |
| `src/lib/appwrite/client.ts` | Browser-side Appwrite client |
| `src/lib/appwrite/server.ts` | Server-side Appwrite client |
| `src/middleware.ts` | Auth guard for protected routes |

### Dependencies

- `appwrite` SDK (client-side)
- `node-appwrite` SDK (server-side)

### Design Patterns

- **Repository Pattern:** `UserRepository` for user CRUD — [ADR-009](../ADR/ADR-009-repository-pattern.md)
- **Service Layer:** `AuthService.getOrCreateUser()` seeds defaults — [ADR-008](../ADR/ADR-008-service-layer-pattern.md)

### API Routes

- None (auth is client-side via Appwrite SDK)

## Definition of Done

- [ ] All acceptance criteria pass manually
- [ ] Unit test: `AuthService.getOrCreateUser()` creates user + seeds 7 categories
- [ ] Unit test: `AuthService.getOrCreateUser()` returns existing user without duplicating
- [ ] E2E test: Login → Dashboard → Sign Out flow (Playwright)
- [ ] No TypeScript errors
- [ ] Code reviewed

## References

- [PLAN.md](../plans/PLAN.md) — Auth flow section
- [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md) — `users` table
- [API_SPECIFICATION.md](../plans/API_SPECIFICATION.md) — `/api/user/profile`
- [ADR-002](../ADR/ADR-002-appwrite-backend.md) — Appwrite decision
- [UX_DECISIONS.md](../plans/UX_DECISIONS.md) — Flow 1: First-Time Setup
