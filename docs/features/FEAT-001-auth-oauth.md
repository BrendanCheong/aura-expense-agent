# FEAT-001 — OAuth Authentication (Google + GitHub)

> **Status:** � Done  
> **Execution Order:** 3 of 13  
> **Sprint:** 1 — Foundation  
> **Blocked By:** FEAT-003, FEAT-002  
> **Priority:** P0 (Blocker)  
> **Estimate:** 1 day  
> **Assignee:** —  
> **Completed:** 2026-02-15

---

## Summary

Implement user authentication via Appwrite OAuth2 with Google and GitHub providers. Users should be able to sign in, sign out, and have their session persist across page reloads.

## User Stories

- **US-6:** "As a user, I want to sign in with Google or GitHub via OAuth2."

## Acceptance Criteria

- [x] Landing page (`/`) displays "Sign in with Google" and "Sign in with GitHub" buttons
- [x] Clicking a button redirects to the OAuth provider
- [x] Successful auth redirects to `/dashboard`
- [x] Failed auth redirects back to `/login` with an error message
- [x] Unauthenticated access to `/dashboard`, `/transactions`, `/categories`, `/budgets`, `/settings` redirects to `/login`
- [x] User profile is created in the `users` Appwrite table on first login
- [x] 8 default categories are seeded for new users (corrected from 7 per DATABASE_SCHEMA.md)
- [ ] User avatar and name are displayed in the sidebar (deferred to FEAT-007)
- [ ] "Sign Out" button clears session and redirects to `/` (deferred to FEAT-007)
- [x] Session persists across browser refresh (Appwrite session cookie)
- [x] Dev mode bypass: `PROJECT_ENV=dev` skips OAuth and uses mock user

## Technical Details

### Files Created/Modified

| File                                                | Purpose                                                       |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `src/types/user.ts`                                 | User, UserCreate, UserUpdate interfaces                       |
| `src/lib/repositories/interfaces.ts`                | Added IUserRepository interface                               |
| `src/lib/repositories/in-memory/user.repository.ts` | In-memory user repo for testing                               |
| `src/lib/repositories/appwrite/user.repository.ts`  | Appwrite TablesDB user repo                                   |
| `src/lib/services/auth.service.ts`                  | AuthService (getOrCreateUser, getUserById, updateUserProfile) |
| `src/lib/appwrite/client.ts`                        | Browser-side Appwrite client + Account singleton              |
| `src/lib/appwrite/session.ts`                       | Server-side session validation via JWT (HttpOnly cookie)      |
| `src/lib/appwrite/mappers.ts`                       | Added user row mappers                                        |
| `src/middleware.ts`                                 | Auth guard for protected routes (checks `aura_session` cookie)|
| `src/app/(auth)/login/page.tsx`                     | Login page with Google/GitHub OAuth + dev bypass              |
| `src/app/(auth)/callback/page.tsx`                  | OAuth callback — gets temp JWT, calls /api/auth/session       |
| `src/app/api/auth/session/route.ts`                 | POST: server-side JWT creation + ensure user; DELETE: logout  |
| `src/app/api/auth/refresh/route.ts`                 | POST: refresh JWT before expiry (30-min window)               |
| `src/app/api/auth/dev-login/route.ts`               | Dev-only login bypass endpoint                                |
| `src/app/api/user/profile/route.ts`                 | GET/PATCH user profile (implemented)                          |
| `src/app/page.tsx`                                  | Landing page with Sign In link                                |
| `src/app/dashboard/page.tsx`                        | Redirect /dashboard → / (route group mapping)                 |
| `src/hooks/use-session-refresh.ts`                  | Client hook: auto-refresh JWT every 25 min                    |
| `src/components/auth/SessionRefreshProvider.tsx`     | Client component wiring session refresh into layout           |
| `src/lib/container/container.ts`                    | Added AuthService to DI container                             |
| `src/lib/factories/repository.factory.ts`           | Added users repo to factory                                   |

### Dependencies

- `appwrite` SDK (client-side)
- `node-appwrite` SDK (server-side)

### Design Patterns

- **Repository Pattern:** `UserRepository` for user CRUD — [ADR-009](../ADR/ADR-009-repository-pattern.md)
- **Service Layer:** `AuthService.getOrCreateUser()` seeds defaults — [ADR-008](../ADR/ADR-008-service-layer-pattern.md)
- **Server-side JWT:** Uses Appwrite `users.createJWT()` (admin SDK) — never exposed to client JS
- **HttpOnly cookies:** JWT stored as HttpOnly/Secure/SameSite=Lax — XSS-safe
- **Single Source of Truth:** Appwrite Auth = identity, DB `users` table = app data

### JWT Flow

```
1. User clicks "Sign in with GitHub" → Appwrite OAuth2
2. Appwrite redirects to /callback with session on Appwrite domain
3. Callback: account.createJWT() → temporary client JWT (15 min)
4. Callback: POST /api/auth/session with Bearer {temp JWT}
5. Server: verifies JWT → users.createJWT(30 min) → ensure user in DB
6. Server: sets HttpOnly aura_session cookie → returns user
7. Client: redirects to /dashboard (→ /)
8. Every 25 min: /api/auth/refresh renews the JWT
```

### API Routes

- `POST /api/auth/session` — Create session (JWT + ensure user)
- `DELETE /api/auth/session` — Logout (clear cookie)
- `POST /api/auth/refresh` — Refresh JWT before expiry

## Definition of Done

- [x] All acceptance criteria pass manually (excluding sidebar UI deferred to FEAT-007)
- [x] Unit test: `AuthService.getOrCreateUser()` creates user + seeds 8 categories
- [x] Unit test: `AuthService.getOrCreateUser()` returns existing user without duplicating
- [ ] E2E test: Login → Dashboard → Sign Out flow (Playwright) — deferred to FEAT-011
- [x] No TypeScript errors
- [x] All 146 tests passing (17 test files)
- [x] UserRepository (in-memory + Appwrite) with full test coverage
- [x] AuthService with full test coverage
- [x] Middleware route protection
- [x] Server-side session validation

## References

- [PLAN.md](../plans/PLAN.md) — Auth flow section
- [DATABASE_SCHEMA.md](../plans/DATABASE_SCHEMA.md) — `users` table
- [API_SPECIFICATION.md](../plans/API_SPECIFICATION.md) — `/api/user/profile`
- [ADR-002](../ADR/ADR-002-appwrite-backend.md) — Appwrite decision
- [UX_DECISIONS.md](../plans/UX_DECISIONS.md) — Flow 1: First-Time Setup
