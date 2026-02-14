# FEAT-003 — Project Scaffolding & Configuration

> **Status:** � Done  
> **Execution Order:** 1 of 13  
> **Sprint:** 1 — Foundation  
> **Blocked By:** —  
> **Priority:** P0 (Blocker)  
> **Estimate:** 1 day  
> **Assignee:** —

---

## Summary

Initialize the Next.js 19 project with all required configurations, install dependencies, set up the project folder structure following LangGraph.js recommended conventions, and configure all dev tooling (TypeScript strict, Tailwind v4, Vitest, Playwright, ESLint).

## Acceptance Criteria

- [ ] `npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS v4
- [ ] `shadcn/ui` initialized with `npx shadcn@latest init`
- [ ] Project structure matches [PLAN.md](../plans/PLAN.md) folder tree
- [ ] Agent code follows LangGraph.js recommended structure: `src/lib/agent/graph.ts`, `src/lib/agent/tools/`, `src/lib/agent/state.ts`
- [ ] TypeScript `strict: true` in `tsconfig.json`
- [ ] Vitest configured with path aliases and setup file
- [ ] Playwright installed with `playwright.config.ts`
- [ ] ESLint configured with Next.js recommended rules
- [ ] `.env.example` with all required variables documented
- [ ] `.gitignore` includes `.env.local`, `node_modules`, `.next`
- [ ] DI container skeleton created (`src/lib/container.ts`)
- [ ] Repository interfaces defined (`src/lib/repositories/interfaces/`)
- [ ] Service stubs created (`src/lib/services/`)
- [ ] `npm run dev` starts without errors

## Technical Details

### Dependencies

**Production:**
```json
{
  "next": "^15.x",
  "@langchain/langgraph": "^0.x",
  "@langchain/openai": "^0.x",
  "appwrite": "^16.x",
  "node-appwrite": "^14.x",
  "resend": "^4.x",
  "recharts": "^2.x",
  "zod": "^3.x"
}
```

**Development:**
```json
{
  "vitest": "^3.x",
  "@playwright/test": "^1.x",
  "@types/node": "^22.x",
  "typescript": "^5.x"
}
```

### Folder Structure

```
src/
├── app/               ← Next.js App Router pages
├── components/        ← shadcn/ui + custom components
├── lib/
│   ├── agent/         ← LangGraph.js agent (ADR-003)
│   ├── appwrite/      ← Appwrite client config
│   ├── repositories/  ← Repository interfaces + implementations (ADR-009)
│   ├── services/      ← Service layer (ADR-008)
│   ├── utils/         ← Date, currency, vendor helpers
│   └── container.ts   ← DI container (ADR-007)
├── hooks/             ← React custom hooks
└── types/             ← Shared TypeScript types
```

## Definition of Done

- [ ] `npm run dev` starts and shows Next.js welcome page
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm test` runs Vitest (0 tests, 0 failures)
- [ ] `npx playwright test` runs (0 tests, 0 failures)
- [ ] All acceptance criteria met
- [ ] Folder structure matches plan

## References

- [PLAN.md](../plans/PLAN.md) — Project structure tree
- [ADR-001](../ADR/ADR-001-nextjs-framework.md) — Next.js decision
- [ADR-005](../ADR/ADR-005-shadcn-ui.md) — shadcn/ui decision
- [ADR-007](../ADR/ADR-007-dependency-injection.md) — DI container
- [ADR-011](../ADR/ADR-011-typescript-language.md) — TypeScript end-to-end
- [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md) — Service + Repository layer structure
