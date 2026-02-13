# ADR-001: Next.js 19 as Full-Stack Framework

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-09 |
| **Decision Makers** | Solutions Architect |
| **References** | [PLAN.md](../plans/PLAN.md), [API_SPECIFICATION.md](../plans/API_SPECIFICATION.md), [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md) |

---

## Context

Aura requires a full-stack TypeScript application that handles:
1. Server-side rendered dashboard pages
2. API routes for webhook handling and CRUD operations
3. Client-side interactive charts and forms
4. OAuth2 authentication flow

We evaluated several frameworks for the application server.

---

## Decision

**Use Next.js 19 (App Router) as the single full-stack framework.**

---

## Options Considered

### Option A: Next.js 19 (App Router) — **CHOSEN**

**Pros:**
- Unified TypeScript codebase — frontend, API routes, and server components in one project
- App Router provides React Server Components (RSC) for zero-JS dashboard renders
- API routes handle webhooks natively — no separate backend server needed
- Native Vercel deployment with edge functions, preview deployments, and analytics
- LangGraph.js agent can be invoked directly from API routes — no HTTP bridge
- Massive ecosystem: shadcn/ui, next-auth, middleware, image optimization
- Streaming support for long-running agent responses (V2)

**Cons:**
- App Router is still maturing — some patterns (parallel routes, intercepting routes) can be complex
- Cold starts on Vercel serverless can add ~200ms latency to first webhook
- API routes are serverless — no persistent WebSocket connections (acceptable for V1's on-refresh model)
- Bundle size can grow if not careful with `'use client'` boundaries

### Option B: Express.js + React SPA

**Pros:**
- Full control over server lifecycle (persistent connections, WebSockets)
- Simpler mental model — backend is just an API server, frontend is separate

**Cons:**
- Two separate projects to maintain and deploy
- No server-side rendering without additional setup (Next.js is SSR by default)
- CORS configuration needed between API and frontend
- Two deployment targets (Docker/EC2 for Express, CDN for React)
- Agent invocation requires an HTTP call from the frontend to the API

### Option C: Remix

**Pros:**
- Progressive enhancement, form-first approach
- Nested routes with loaders and actions
- Good DX for data mutations

**Cons:**
- Smaller ecosystem than Next.js
- Fewer deployment options with managed hosting
- shadcn/ui has better Next.js integration
- LangGraph.js ecosystem examples predominantly use Next.js

### Option D: Hono + React SPA

**Pros:**
- Ultra-lightweight edge runtime
- TypeScript-first, fast cold starts
- Works on Cloudflare Workers, Deno, Bun

**Cons:**
- No built-in SSR/RSC support
- Would need a separate frontend framework
- Smaller community, fewer examples for AI agent integration

---

## Consequences

### Positive
- Single deployment artifact on Vercel — simpler CI/CD
- Agent invocation is a direct function call from API routes — 0ms network overhead
- RSC reduces JavaScript shipped to the client → faster dashboard loads
- Unified TypeScript types shared between API and frontend

### Negative
- Vendor lock-in to Vercel for optimal deployment (can self-host but loses edge optimizations)
- API routes are stateless/serverless — no in-process caching (mitigated by Appwrite vendor cache)
- Team must understand RSC boundary (`'use client'` vs server components)

### Risks
- **Cold start latency:** Vercel serverless cold starts could delay webhook processing by ~200ms. Mitigated by Vercel's automatic warm-keeping for frequently called endpoints.
- **Function timeout:** Vercel hobby plan has a 60s function timeout. Agent invocation with web search takes < 10s. Production plan extends to 300s.

---

## Validation

- Next.js 19 is the recommended framework by the LangChain.js team for LangGraph.js applications
- Vercel's AI SDK has native LangChain.js integration
- All example projects in the LangGraph.js documentation use Next.js
