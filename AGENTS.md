# AGENTS.md — Aura Expense Agent

> Quick-reference for AI agents and developers working on this codebase.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack), port `4321`
- **Language:** TypeScript 5.9 strict
- **Backend:** Appwrite Cloud (TablesDB API), `node-appwrite@22`
- **Package Manager:** pnpm 10
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **UI:** Tailwind v4, shadcn/ui, Recharts
- **Currency:** SGD only, timezone `Asia/Singapore`

---

## Code Style & Conventions

### ESLint Rules (enforced)

- **`curly: ['error', 'all']`** — braces required on all `if`/`else`/`for`/`while`, even single-line returns
- **`import/order`** — grouped: builtin → external → internal (`@/`), alphabetized within groups, blank line between groups
- **`@typescript-eslint/no-unused-vars`** — unused vars error; prefix with `_` to suppress (e.g. `_unused`)

### Naming

- Private class methods: **underscore prefix** `_methodName`
- Private class constants: `private static readonly _CONSTANT_NAME`
- Appwrite rows: `snake_case` → TypeScript domain types: `camelCase` (via mappers)

### Constants & Magic Values

- **Repeated across files** → `src/lib/constants.ts` (e.g. `HttpStatus`, `ErrorMessage`, `PROJECT_ENV_DEV`, `SGT_OFFSET`)
- **Single-use thresholds** → `private static readonly` on the class (e.g. `BudgetService._WARNING_THRESHOLD`)
- **Never use raw status codes** — always `HttpStatus.OK`, `HttpStatus.BAD_REQUEST`, etc.
- **Never match errors with `.includes()`** — use typed error classes with `instanceof`

### Error Handling

- All custom errors live in `src/lib/errors/index.ts`
- Route handlers catch typed errors via `instanceof` (e.g. `BudgetNotFoundError`, `CategoryAlreadyExistsError`)
- Services throw domain-specific errors; routes translate to HTTP status codes

### SOLID

- If a utility function is used by **only one class**, make it a **private method** on that class
- Public utils in `src/lib/utils/` only if used by **2+ consumers**

---

## Appwrite TablesDB API

We use `node-appwrite@22` with the **TablesDB** service (not `Databases`). All method calls **must** use the **named parameter object style** — the positional argument style is deprecated.

### Named Parameter Style (required)

```typescript
import { TablesDB, ID, Query } from 'node-appwrite';

// Get a row
const row = await tablesDb.getRow({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  rowId: id,
});

// List rows with queries
const result = await tablesDb.listRows({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  queries: [
    Query.equal('user_id', userId),
    Query.orderDesc('transaction_date'),
    Query.limit(25),
    Query.offset(0),
  ],
});

// Create a row
await tablesDb.createRow({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  rowId: ID.unique(),
  data: { user_id: userId, amount: 100 },
});

// Update a row
await tablesDb.updateRow({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  rowId: id,
  data: { amount: 200 },
});

// Upsert a row (create or update)
await tablesDb.upsertRow({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  rowId: id,
  data: { amount: 200 },
});

// Delete a row
await tablesDb.deleteRow({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  rowId: id,
});

// Atomic increment
await tablesDb.incrementRowColumn({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  rowId: id,
  column: 'hit_count',
  value: 1,
});
```

### Query Operators

```typescript
Query.equal('field', ['value1', 'value2']); // OR within same field
Query.notEqual('field', 'value');
Query.greaterThan('field', 100);
Query.lessThan('field', 100);
Query.greaterThanEqual('field', 100);
Query.lessThanEqual('field', 100);
Query.between('field', 5, 10);
Query.contains('field', 'substring');
Query.startsWith('field', 'prefix');
Query.search('field', 'keywords'); // requires fulltext index
Query.isNull('field');
Query.isNotNull('field');
Query.select(['field1', 'field2']); // select specific columns
Query.orderAsc('field');
Query.orderDesc('field');
Query.limit(25);
Query.offset(0);
Query.cursorAfter('rowId');

// Logical operators
Query.and([Query.greaterThan('a', 5), Query.lessThan('a', 10)]);
Query.or([Query.equal('status', ['draft']), Query.equal('status', ['archived'])]);
```

### Transactions

```typescript
const tx = await tablesDb.createTransaction();

await tablesDb.createRow({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  rowId: ID.unique(),
  data: { name: 'Walter' },
  transactionId: tx.$id,
});

await tablesDb.updateTransaction({ transactionId: tx.$id, commit: true });
// or: await tablesDb.updateTransaction({ transactionId: tx.$id, rollback: true });
```

### Operators (atomic field updates)

```typescript
import { Operator } from 'node-appwrite';

await tablesDb.updateRow({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  rowId: id,
  data: {
    count: Operator.increment(1),
    tags: Operator.arrayAppend(['new-tag']),
    lastModified: Operator.dateSetNow(),
    active: Operator.toggle(),
  },
});
```

### Schema Setup (server SDK)

```typescript
// Column types: string is DEPRECATED → use varchar, text, mediumtext, longtext
// Also use createEmailColumn, createUrlColumn for specialized types
await tablesDb.createVarcharColumn({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  key: 'name',
  size: 255,
  required: true,
});

await tablesDb.createEmailColumn({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  key: 'email',
  required: true,
});

await tablesDb.createTextColumn({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  key: 'description',
  required: false,
});

await tablesDb.createIntegerColumn({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  key: 'year',
  required: true,
  min: 2020,
  max: 2100,
});

await tablesDb.createIndex({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  key: 'idx_email',
  type: IndexType.Unique,
  columns: ['email'],
});
```

### Performance Tips

- Pass `total: false` to `listRows` when you don't need the total count
- Use `Query.select([...])` to reduce payload size
- Index columns used in queries, ordering, and filters
- Relationships are opt-in — use `Query.select(['*', 'relation.*'])` to load them
- `$sequence` field available for insertion-order sorting

---

## Architecture Patterns

### Layered Architecture

```
API Route → Service → Repository → Appwrite TablesDB
```

- **API Routes** handle HTTP, validation, auth
- **Services** contain business logic, orchestration
- **Repositories** abstract data access behind interfaces
- **No direct DB access from routes or services**

### Repository Pattern (ADR-009)

Interface-driven with two implementations:

| Implementation          | Purpose                       |
| ----------------------- | ----------------------------- |
| `InMemoryXxxRepository` | Unit tests (fast, no network) |
| `AppwriteXxxRepository` | Production (Appwrite Cloud)   |

5 repositories: `Transaction`, `Category`, `Budget`, `VendorCache`, `User`

### Factory Pattern (ADR-010)

```typescript
RepositoryFactory.createInMemory(); // for tests
RepositoryFactory.createAppwrite(tablesDb); // for production
```

### DI Container (ADR-007)

```typescript
const container = createContainer(); // singleton, cached
const { transactionService, budgetService } = container;
```

### Data Mapping

Snake_case (Appwrite rows) ↔ camelCase (TypeScript types) via mapper functions in `src/lib/appwrite/mappers.ts`.

### Generated Appwrite Types

Row types are **auto-generated** from the live schema via Appwrite CLI:

```bash
appwrite pull tables-db --all --force   # sync schema to appwrite.config.json
appwrite types src/types/appwrite --language ts  # generate appwrite.d.ts
```

Type chain: `appwrite.d.ts` (generated) → `rows.ts` (re-exports as aliases) → `mappers.ts` (typed row↔domain conversion) → repositories (generic SDK calls).

All SDK calls use generic type parameters for end-to-end type safety:

```typescript
const row = await tablesDb.getRow<TransactionRow>({ ... });
const result = await tablesDb.listRows<TransactionRow>({ ... });
const created = await tablesDb.createRow<TransactionRow>({ ..., data: rowData });
```

---

## Testing

- **Runner:** Vitest 4 with `@swc/core` transform
- **Strategy:** TDD (Red → Green → Refactor)
- **Fixture data:** `__tests__/fixtures/`
- **Test structure mirrors source:** `__tests__/unit/repositories/`, `__tests__/unit/services/`, etc.

### Testing Appwrite Repos

Mock `TablesDB` methods — they receive named parameter objects:

```typescript
const tablesDb = {
  getRow: vi.fn(),
  listRows: vi.fn(),
  createRow: vi.fn(),
  updateRow: vi.fn(),
  deleteRow: vi.fn(),
};

// Assert named params
expect(tablesDb.deleteRow).toHaveBeenCalledWith({
  databaseId: DB_ID,
  tableId: TABLE_ID,
  rowId: 'tx-1',
});

// Access mock args
const call = tablesDb.listRows.mock.calls[0];
const { queries } = call[0] as { queries: string[] };
```

---

## Key Files

| Path                                      | Purpose                               |
| ----------------------------------------- | ------------------------------------- |
| `src/lib/repositories/interfaces.ts`      | All repository interfaces             |
| `src/lib/repositories/appwrite/`          | Appwrite implementations              |
| `src/lib/repositories/in-memory/`         | In-memory implementations (tests)     |
| `src/lib/services/`                       | Business logic services               |
| `src/lib/factories/repository.factory.ts` | Factory for repo creation             |
| `src/lib/container/container.ts`          | DI container wiring                   |
| `src/lib/constants.ts`                    | Shared constants, HttpStatus, enums   |
| `src/lib/errors/index.ts`                 | All custom error classes              |
| `src/lib/appwrite/mappers.ts`             | Row ↔ entity mappers                  |
| `src/types/appwrite/appwrite.d.ts`        | Auto-generated row types (CLI)        |
| `src/types/appwrite/rows.ts`              | Row type aliases for repos/mappers    |
| `src/types/budget.ts`                     | Budget domain types                   |
| `src/types/webhook.ts`                    | Webhook domain types                  |
| `src/types/dashboard.ts`                  | Dashboard domain types                |
| `src/lib/appwrite/config.ts`              | Env-based config constants            |
| `src/lib/appwrite/server.ts`              | Server-side Appwrite client singleton |
| `scripts/setup-appwrite.ts`               | Database schema setup (idempotent)    |
| `scripts/seed-db.ts`                      | Test data seeding                     |

---

## CLI Commands

```bash
pnpm dev              # Start dev server (port 4321)
pnpm build            # Production build
pnpm test             # Run all Vitest tests
pnpm db:setup         # Create database schema
pnpm db:seed          # Seed test data
appwrite pull tables-db --all --force  # Sync schema from cloud
appwrite types src/types/appwrite --language ts  # Regenerate types
```
