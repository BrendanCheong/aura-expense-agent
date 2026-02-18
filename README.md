# Aura Expense Agent

Aura Expense Agent is a personal expense-tracking app built for one core problem:

> Bank and card transactions arrive across many email formats, and manually collating, categorizing, and budgeting them is tedious and error-prone.

Instead of manually copying transactions into a spreadsheet, Aura turns inbound email receipts/statements into structured transactions, auto-categorizes them, and gives you a clean place to review and budget.

## Why this exists

If your expenses come from multiple banks/cards, your monthly routine often looks like this:

- Search email inbox for transaction alerts/statements
- Extract merchant, amount, and date manually
- Normalize inconsistent merchant names
- Categorize spending by hand
- Reconcile against your monthly budget

Aura automates that loop while still keeping you in control when AI confidence is low.

## How it works (high level)

1. You forward bank/expense emails to your inbound address (Resend webhook).
2. Aura verifies and processes the email.
3. It tries fast-path categorization via vendor cache, then uses the AI agent if needed.
4. A transaction is created and available for review/editing in the app.

## Key features

### Implemented

- OAuth sign-in and protected app routes
- Category management (create/update/delete)
- Inbound email webhook pipeline (verification, dedup, parsing)
- AI expense extraction and categorization agent (LangGraph.js)
- Vendor cache memory to improve repeat categorization speed/accuracy

### In progress / planned

- Full transactions page UX (list + CRUD polish)
- Budget management workflows
- Dashboard visualizations and budget alerts
- AI feedback loop memory enhancements
- Full test/deployment hardening

## Tech stack

- **Frontend/App:** Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.9
- **UI:** Tailwind CSS v4, shadcn/ui, Recharts
- **Backend/BaaS:** Appwrite Cloud (TablesDB API via `node-appwrite@22`)
- **AI:** LangGraph.js + LangChain + OpenAI integration
- **Integrations:** Resend (inbound email), Svix (webhook signature verification), Mem0 (memory), Brave Search via Smithery MCP
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Tooling:** pnpm, ESLint, Prettier

## Architecture & design patterns

Aura follows a layered architecture:

`API Route → Service → Repository → Appwrite TablesDB`

Core patterns used:

- **Dependency Injection** for testable composition
- **Service Layer** for business logic orchestration
- **Repository Pattern** with Appwrite + in-memory implementations
- **Factory Pattern** for repository/agent creation
- **Strategy Pattern** for multi-tier categorization flow

This keeps API handlers thin, business logic isolated, and data access replaceable for tests.

## Project status

This project is actively developed for personal use. Core ingestion + AI categorization pipeline is working; dashboarding, budgeting UX, and deployment/test completeness are being expanded incrementally.

## Local development

### Prerequisites

- Node.js 20+
- pnpm 10+
- Appwrite project (or local emulator setup)
- Resend account (for inbound email webhook testing)

### Run locally

```bash
pnpm install
pnpm dev
```

App URL: `http://localhost:4321`

### Useful commands

```bash
pnpm test          # Run unit/integration tests (Vitest)
pnpm test:e2e      # Run E2E tests (Playwright)
pnpm build         # Production build
pnpm db:setup      # Create/update Appwrite schema
pnpm db:seed       # Seed development data
```

## Documentation

- Product/features: `docs/features/`
- Architecture decisions (ADRs): `docs/ADR/`
- Implementation plans: `docs/plans/`
- Test plans: `docs/testing-plan/`

If you are reading this from GitHub first: start with this README for orientation, then jump to ADRs for architectural rationale and `docs/features` for delivery status.
