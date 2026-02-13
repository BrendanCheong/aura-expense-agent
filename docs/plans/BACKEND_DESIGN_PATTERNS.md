# Aura Expense Agent — Backend Design Patterns

> **Principles:** SOLID + Clean Architecture  
> **Patterns:** Repository, Service, Factory, Strategy, Dependency Injection  
> **Language:** TypeScript (strict mode)  
> **Runtime:** Next.js 19 API Routes (App Router)  
> **References:** [ADR-007](../ADR/ADR-007-dependency-injection.md), [ADR-008](../ADR/ADR-008-service-layer-pattern.md), [ADR-009](../ADR/ADR-009-repository-pattern.md)

---

## 📋 Design Philosophy

Every API route in Aura follows a strict layered architecture with dependency injection. The goal is **testability, maintainability, and separation of concerns**. No API route directly touches the database — all data access flows through repositories, all business logic lives in services, and all dependencies are injected via a DI container.

```
┌─────────────────────────────────────────────────────────────┐
│  API Route (Controller)                                      │
│  Responsibility: HTTP request/response, validation, auth     │
│  Pattern: Injector → injects services into route handlers    │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                               │
│  Responsibility: Business logic, orchestration               │
│  Pattern: Service classes with constructor injection         │
├─────────────────────────────────────────────────────────────┤
│  Repository Layer                                            │
│  Responsibility: Data access abstraction                     │
│  Pattern: Repository interface + Appwrite implementation     │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (Appwrite Cloud / MariaDB)                       │
│  Responsibility: Persistence                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏛️ SOLID Principles Applied

### S — Single Responsibility

| Component | Single Responsibility |
|-----------|----------------------|
| `TransactionRepository` | CRUD operations on the `transactions` table |
| `TransactionService` | Business rules: dedup, budget checks, vendor cache updates |
| `POST /api/webhooks/resend` | HTTP handling: parse webhook, validate signature, return response |
| `ExpenseAgent` | AI orchestration: invoke LangGraph, manage agent state |
| `BraveSearchTool` | External web search API call |

**Anti-pattern avoided:** API route that queries the DB, runs business logic, calls the agent, and formats the response all in one function.

### O — Open/Closed

The agent's categorization strategy is extensible without modifying existing code:

```typescript
// Strategy pattern — new categorization sources can be added without touching existing ones
interface CategorizationStrategy {
  name: string;
  confidence: 'high' | 'medium' | 'low';
  resolve(vendor: string, context: CategorizationContext): Promise<CategoryMatch | null>;
}

class VendorCacheStrategy implements CategorizationStrategy { ... }
class LLMCategoryMatchStrategy implements CategorizationStrategy { ... }
class BraveSearchStrategy implements CategorizationStrategy { ... }
class FallbackOtherStrategy implements CategorizationStrategy { ... }
```

### L — Liskov Substitution

All repository implementations are interchangeable:

```typescript
// Test: uses InMemoryTransactionRepository
// Production: uses AppwriteTransactionRepository
// Both satisfy the same ITransactionRepository interface
```

### I — Interface Segregation

```typescript
// ❌ BAD: One massive interface
interface IDataAccess {
  getTransactions(): Promise<Transaction[]>;
  createCategory(): Promise<Category>;
  updateBudget(): Promise<Budget>;
  checkVendorCache(): Promise<VendorCache | null>;
}

// ✅ GOOD: Small, focused interfaces
interface ITransactionRepository { ... }
interface ICategoryRepository { ... }
interface IBudgetRepository { ... }
interface IVendorCacheRepository { ... }
```

### D — Dependency Inversion

```typescript
// ❌ BAD: Service directly depends on concrete Appwrite implementation
class TransactionService {
  private db = new Databases(appwriteClient); // tightly coupled
}

// ✅ GOOD: Service depends on abstraction, injected at construction
class TransactionService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly vendorCacheRepo: IVendorCacheRepository,
  ) {}
}
```

---

## 📦 Repository Pattern

### Interface Definitions

```typescript
// src/lib/repositories/interfaces.ts

import type { Transaction, TransactionCreate, TransactionUpdate } from '@/types/transaction';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/category';
import type { Budget, BudgetCreate, BudgetUpdate } from '@/types/budget';
import type { VendorCacheEntry } from '@/types/vendor-cache';

// --- Transaction Repository ---
export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findByUserId(userId: string, options: TransactionQueryOptions): Promise<PaginatedResult<Transaction>>;
  findByResendEmailId(resendEmailId: string): Promise<Transaction | null>;
  findByUserAndDateRange(userId: string, start: string, end: string): Promise<Transaction[]>;
  findByUserCategoryDateRange(userId: string, categoryId: string, start: string, end: string): Promise<Transaction[]>;
  create(data: TransactionCreate): Promise<Transaction>;
  update(id: string, data: TransactionUpdate): Promise<Transaction>;
  delete(id: string): Promise<void>;
  sumByUserCategoryDateRange(userId: string, start: string, end: string): Promise<CategorySpendingSummary[]>;
}

export interface TransactionQueryOptions {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  source?: 'email' | 'manual';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CategorySpendingSummary {
  categoryId: string;
  categoryName: string;
  totalSpent: number;
}

// --- Category Repository ---
export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findByUserId(userId: string): Promise<Category[]>;
  findByUserIdAndName(userId: string, name: string): Promise<Category | null>;
  create(data: CategoryCreate): Promise<Category>;
  update(id: string, data: CategoryUpdate): Promise<Category>;
  delete(id: string): Promise<void>;
  seedDefaults(userId: string): Promise<Category[]>;
}

// --- Budget Repository ---
export interface IBudgetRepository {
  findById(id: string): Promise<Budget | null>;
  findByUserAndPeriod(userId: string, year: number, month: number): Promise<Budget[]>;
  findByUserCategoryPeriod(userId: string, categoryId: string, year: number, month: number): Promise<Budget | null>;
  create(data: BudgetCreate): Promise<Budget>;
  update(id: string, data: BudgetUpdate): Promise<Budget>;
  delete(id: string): Promise<void>;
  deleteByCategoryId(categoryId: string): Promise<void>;
}

// --- Vendor Cache Repository ---
export interface IVendorCacheRepository {
  findByUserAndVendor(userId: string, vendorName: string): Promise<VendorCacheEntry | null>;
  findByUserId(userId: string): Promise<VendorCacheEntry[]>;
  create(userId: string, vendorName: string, categoryId: string): Promise<VendorCacheEntry>;
  incrementHitCount(id: string, currentCount: number): Promise<void>;
  deleteByCategoryId(categoryId: string): Promise<void>;
}
```

### Appwrite Implementation

```typescript
// src/lib/repositories/appwrite/transaction.repository.ts

import { Query, ID } from 'node-appwrite';
import type { Databases } from 'node-appwrite';
import type {
  ITransactionRepository,
  TransactionQueryOptions,
  PaginatedResult,
  CategorySpendingSummary,
} from '../interfaces';
import type { Transaction, TransactionCreate, TransactionUpdate } from '@/types/transaction';
import { APPWRITE_CONFIG } from '@/lib/appwrite/config';

export class AppwriteTransactionRepository implements ITransactionRepository {
  private readonly databaseId: string;
  private readonly collectionId: string;

  constructor(private readonly databases: Databases) {
    this.databaseId = APPWRITE_CONFIG.databaseId;
    this.collectionId = APPWRITE_CONFIG.tables.transactions;
  }

  async findById(id: string): Promise<Transaction | null> {
    try {
      const doc = await this.databases.getDocument(this.databaseId, this.collectionId, id);
      return this.mapToTransaction(doc);
    } catch {
      return null;
    }
  }

  async findByResendEmailId(resendEmailId: string): Promise<Transaction | null> {
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [Query.equal('resend_email_id', resendEmailId)]
    );
    return result.total > 0 ? this.mapToTransaction(result.documents[0]) : null;
  }

  async findByUserId(userId: string, options: TransactionQueryOptions): Promise<PaginatedResult<Transaction>> {
    const queries = [
      Query.equal('user_id', userId),
      Query.limit(options.limit),
      Query.offset((options.page - 1) * options.limit),
    ];

    if (options.startDate) queries.push(Query.greaterThanEqual('transaction_date', options.startDate));
    if (options.endDate) queries.push(Query.lessThan('transaction_date', options.endDate));
    if (options.categoryId) queries.push(Query.equal('category_id', options.categoryId));
    if (options.source) queries.push(Query.equal('source', options.source));

    const sortField = options.sortBy || 'transaction_date';
    const sortOrder = options.sortOrder || 'desc';
    queries.push(sortOrder === 'asc' ? Query.orderAsc(sortField) : Query.orderDesc(sortField));

    const result = await this.databases.listDocuments(this.databaseId, this.collectionId, queries);

    return {
      data: result.documents.map(this.mapToTransaction),
      total: result.total,
      page: options.page,
      limit: options.limit,
      hasMore: result.total > options.page * options.limit,
    };
  }

  async findByUserAndDateRange(userId: string, start: string, end: string): Promise<Transaction[]> {
    const result = await this.databases.listDocuments(this.databaseId, this.collectionId, [
      Query.equal('user_id', userId),
      Query.greaterThanEqual('transaction_date', start),
      Query.lessThan('transaction_date', end),
      Query.limit(1000),
    ]);
    return result.documents.map(this.mapToTransaction);
  }

  async findByUserCategoryDateRange(userId: string, categoryId: string, start: string, end: string): Promise<Transaction[]> {
    const result = await this.databases.listDocuments(this.databaseId, this.collectionId, [
      Query.equal('user_id', userId),
      Query.equal('category_id', categoryId),
      Query.greaterThanEqual('transaction_date', start),
      Query.lessThan('transaction_date', end),
      Query.limit(1000),
    ]);
    return result.documents.map(this.mapToTransaction);
  }

  async create(data: TransactionCreate): Promise<Transaction> {
    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      ID.unique(),
      data
    );
    return this.mapToTransaction(doc);
  }

  async update(id: string, data: TransactionUpdate): Promise<Transaction> {
    const doc = await this.databases.updateDocument(
      this.databaseId,
      this.collectionId,
      id,
      data
    );
    return this.mapToTransaction(doc);
  }

  async delete(id: string): Promise<void> {
    await this.databases.deleteDocument(this.databaseId, this.collectionId, id);
  }

  async sumByUserCategoryDateRange(userId: string, start: string, end: string): Promise<CategorySpendingSummary[]> {
    // Appwrite doesn't support aggregation — fetch all and sum in memory
    // Acceptable for V1 with < 1000 transactions/month
    const transactions = await this.findByUserAndDateRange(userId, start, end);
    const summaryMap = new Map<string, { categoryId: string; categoryName: string; totalSpent: number }>();

    for (const tx of transactions) {
      const existing = summaryMap.get(tx.categoryId) || { categoryId: tx.categoryId, categoryName: '', totalSpent: 0 };
      existing.totalSpent += tx.amount;
      summaryMap.set(tx.categoryId, existing);
    }

    return Array.from(summaryMap.values());
  }

  private mapToTransaction(doc: any): Transaction {
    return {
      id: doc.$id,
      userId: doc.user_id,
      categoryId: doc.category_id,
      amount: doc.amount,
      vendor: doc.vendor,
      description: doc.description,
      transactionDate: doc.transaction_date,
      resendEmailId: doc.resend_email_id,
      rawEmailSubject: doc.raw_email_subject,
      confidence: doc.confidence,
      source: doc.source,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    };
  }
}
```

### In-Memory Implementation (for Testing)

```typescript
// src/lib/repositories/in-memory/transaction.repository.ts

import type {
  ITransactionRepository,
  TransactionQueryOptions,
  PaginatedResult,
  CategorySpendingSummary,
} from '../interfaces';
import type { Transaction, TransactionCreate, TransactionUpdate } from '@/types/transaction';
import { v4 as uuid } from 'uuid';

export class InMemoryTransactionRepository implements ITransactionRepository {
  private store: Map<string, Transaction> = new Map();

  async findById(id: string): Promise<Transaction | null> {
    return this.store.get(id) ?? null;
  }

  async findByResendEmailId(resendEmailId: string): Promise<Transaction | null> {
    for (const tx of this.store.values()) {
      if (tx.resendEmailId === resendEmailId) return tx;
    }
    return null;
  }

  async findByUserId(userId: string, options: TransactionQueryOptions): Promise<PaginatedResult<Transaction>> {
    let data = Array.from(this.store.values()).filter(tx => tx.userId === userId);

    if (options.startDate) data = data.filter(tx => tx.transactionDate >= options.startDate!);
    if (options.endDate) data = data.filter(tx => tx.transactionDate < options.endDate!);
    if (options.categoryId) data = data.filter(tx => tx.categoryId === options.categoryId);
    if (options.source) data = data.filter(tx => tx.source === options.source);

    const total = data.length;
    const start = (options.page - 1) * options.limit;
    const paged = data.slice(start, start + options.limit);

    return { data: paged, total, page: options.page, limit: options.limit, hasMore: total > start + options.limit };
  }

  async findByUserAndDateRange(userId: string, start: string, end: string): Promise<Transaction[]> {
    return Array.from(this.store.values()).filter(
      tx => tx.userId === userId && tx.transactionDate >= start && tx.transactionDate < end
    );
  }

  async findByUserCategoryDateRange(userId: string, categoryId: string, start: string, end: string): Promise<Transaction[]> {
    return Array.from(this.store.values()).filter(
      tx => tx.userId === userId && tx.categoryId === categoryId && tx.transactionDate >= start && tx.transactionDate < end
    );
  }

  async create(data: TransactionCreate): Promise<Transaction> {
    const tx: Transaction = {
      id: uuid(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Transaction;
    this.store.set(tx.id, tx);
    return tx;
  }

  async update(id: string, data: TransactionUpdate): Promise<Transaction> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Transaction ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async sumByUserCategoryDateRange(userId: string, start: string, end: string): Promise<CategorySpendingSummary[]> {
    const transactions = await this.findByUserAndDateRange(userId, start, end);
    const map = new Map<string, CategorySpendingSummary>();
    for (const tx of transactions) {
      const existing = map.get(tx.categoryId) || { categoryId: tx.categoryId, categoryName: '', totalSpent: 0 };
      existing.totalSpent += tx.amount;
      map.set(tx.categoryId, existing);
    }
    return Array.from(map.values());
  }

  // Test helper: reset the store
  reset(): void {
    this.store.clear();
  }
}
```

---

## 🏭 Factory Pattern

### Agent Factory

Creates the LangGraph expense agent with all dependencies injected.

```typescript
// src/lib/factories/agent.factory.ts

import { createExpenseAgent, type ExpenseAgentConfig } from '@/lib/agent/graph';
import { extractExpenseTool } from '@/lib/agent/tools/extract-expense';
import { lookupCategoriesTool } from '@/lib/agent/tools/lookup-categories';
import { braveSearchTool } from '@/lib/agent/tools/brave-search';
import { logExpenseTool } from '@/lib/agent/tools/log-expense';
import type { ICategoryRepository, ITransactionRepository, IVendorCacheRepository } from '@/lib/repositories/interfaces';

export interface AgentDependencies {
  transactionRepo: ITransactionRepository;
  categoryRepo: ICategoryRepository;
  vendorCacheRepo: IVendorCacheRepository;
  openaiApiKey: string;
  braveSearchApiKey: string;
  model?: string;
}

export class AgentFactory {
  static create(deps: AgentDependencies) {
    // Build tool instances with injected repositories
    const tools = [
      extractExpenseTool,
      lookupCategoriesTool(deps.categoryRepo),
      braveSearchTool(deps.braveSearchApiKey),
      logExpenseTool(deps.transactionRepo, deps.vendorCacheRepo),
    ];

    const config: ExpenseAgentConfig = {
      tools,
      model: deps.model || 'gpt-5.1',
      apiKey: deps.openaiApiKey,
      temperature: 0,
    };

    return createExpenseAgent(config);
  }

  /**
   * Create an agent for testing with mocked tools.
   * Uses InMemory repositories and skips external API calls.
   */
  static createForTesting(overrides?: Partial<AgentDependencies>) {
    const { InMemoryTransactionRepository } = require('@/lib/repositories/in-memory/transaction.repository');
    const { InMemoryCategoryRepository } = require('@/lib/repositories/in-memory/category.repository');
    const { InMemoryVendorCacheRepository } = require('@/lib/repositories/in-memory/vendor-cache.repository');

    const defaults: AgentDependencies = {
      transactionRepo: new InMemoryTransactionRepository(),
      categoryRepo: new InMemoryCategoryRepository(),
      vendorCacheRepo: new InMemoryVendorCacheRepository(),
      openaiApiKey: 'test-key',
      braveSearchApiKey: 'test-key',
      model: 'gpt-5.1',
    };

    return AgentFactory.create({ ...defaults, ...overrides });
  }
}
```

### Repository Factory

Creates repository instances bound to the current Appwrite session.

```typescript
// src/lib/factories/repository.factory.ts

import type { Databases } from 'node-appwrite';
import { AppwriteTransactionRepository } from '@/lib/repositories/appwrite/transaction.repository';
import { AppwriteCategoryRepository } from '@/lib/repositories/appwrite/category.repository';
import { AppwriteBudgetRepository } from '@/lib/repositories/appwrite/budget.repository';
import { AppwriteVendorCacheRepository } from '@/lib/repositories/appwrite/vendor-cache.repository';
import type {
  ITransactionRepository,
  ICategoryRepository,
  IBudgetRepository,
  IVendorCacheRepository,
} from '../repositories/interfaces';

export interface Repositories {
  transactions: ITransactionRepository;
  categories: ICategoryRepository;
  budgets: IBudgetRepository;
  vendorCache: IVendorCacheRepository;
}

export class RepositoryFactory {
  /**
   * Create production Appwrite-backed repositories.
   */
  static create(databases: Databases): Repositories {
    return {
      transactions: new AppwriteTransactionRepository(databases),
      categories: new AppwriteCategoryRepository(databases),
      budgets: new AppwriteBudgetRepository(databases),
      vendorCache: new AppwriteVendorCacheRepository(databases),
    };
  }

  /**
   * Create in-memory repositories for testing.
   */
  static createInMemory(): Repositories {
    const { InMemoryTransactionRepository } = require('@/lib/repositories/in-memory/transaction.repository');
    const { InMemoryCategoryRepository } = require('@/lib/repositories/in-memory/category.repository');
    const { InMemoryBudgetRepository } = require('@/lib/repositories/in-memory/budget.repository');
    const { InMemoryVendorCacheRepository } = require('@/lib/repositories/in-memory/vendor-cache.repository');

    return {
      transactions: new InMemoryTransactionRepository(),
      categories: new InMemoryCategoryRepository(),
      budgets: new InMemoryBudgetRepository(),
      vendorCache: new InMemoryVendorCacheRepository(),
    };
  }
}
```

---

## 💉 Dependency Injection (Injector Pattern)

### DI Container

The injector is a lightweight DI container that wires together repositories, services, and the agent. Each API route calls the injector to get fully initialized service instances.

```typescript
// src/lib/di/container.ts

import { getServerAppwrite } from '@/lib/appwrite/server';
import { RepositoryFactory, type Repositories } from '@/lib/factories/repository.factory';
import { TransactionService } from '@/lib/services/transaction.service';
import { CategoryService } from '@/lib/services/category.service';
import { BudgetService } from '@/lib/services/budget.service';
import { DashboardService } from '@/lib/services/dashboard.service';
import { WebhookService } from '@/lib/services/webhook.service';
import { AgentFactory } from '@/lib/factories/agent.factory';

export interface ServiceContainer {
  transactionService: TransactionService;
  categoryService: CategoryService;
  budgetService: BudgetService;
  dashboardService: DashboardService;
  webhookService: WebhookService;
}

/**
 * Create a fully wired service container for the current request.
 * 
 * Each API route calls this once per request. The Appwrite SDK instance
 * is scoped to the authenticated user's session.
 */
export function createContainer(): ServiceContainer {
  // 1. Get the Appwrite databases client (scoped to current request)
  const { databases } = getServerAppwrite();

  // 2. Create all repositories
  const repos: Repositories = RepositoryFactory.create(databases);

  // 3. Create agent
  const agent = AgentFactory.create({
    transactionRepo: repos.transactions,
    categoryRepo: repos.categories,
    vendorCacheRepo: repos.vendorCache,
    openaiApiKey: process.env.OPENAI_API_KEY!,
    braveSearchApiKey: process.env.BRAVE_SEARCH_API_KEY!,
  });

  // 4. Wire services with their dependencies
  const transactionService = new TransactionService(repos.transactions, repos.vendorCache);
  const categoryService = new CategoryService(repos.categories, repos.vendorCache, repos.budgets);
  const budgetService = new BudgetService(repos.budgets, repos.transactions);
  const dashboardService = new DashboardService(repos.transactions, repos.budgets, repos.categories);
  const webhookService = new WebhookService(repos.transactions, repos.vendorCache, agent);

  return {
    transactionService,
    categoryService,
    budgetService,
    dashboardService,
    webhookService,
  };
}

/**
 * Create a test container with in-memory repositories.
 * No external dependencies (no Appwrite, no OpenAI, no Brave Search).
 */
export function createTestContainer(): ServiceContainer & { repos: Repositories } {
  const repos = RepositoryFactory.createInMemory();
  const agent = AgentFactory.createForTesting();

  const transactionService = new TransactionService(repos.transactions, repos.vendorCache);
  const categoryService = new CategoryService(repos.categories, repos.vendorCache, repos.budgets);
  const budgetService = new BudgetService(repos.budgets, repos.transactions);
  const dashboardService = new DashboardService(repos.transactions, repos.budgets, repos.categories);
  const webhookService = new WebhookService(repos.transactions, repos.vendorCache, agent);

  return {
    transactionService,
    categoryService,
    budgetService,
    dashboardService,
    webhookService,
    repos,
  };
}
```

### Usage in API Routes

```typescript
// src/app/api/transactions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createContainer } from '@/lib/di/container';
import { getAuthenticatedUser } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Inject dependencies
  const { transactionService } = createContainer();

  // 3. Parse query params
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;

  // 4. Delegate to service
  const result = await transactionService.listTransactions(user.id, {
    page, limit, startDate, endDate, categoryId,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { transactionService } = createContainer();
  const body = await request.json();

  const transaction = await transactionService.createManualTransaction(user.id, body);
  return NextResponse.json(transaction, { status: 201 });
}
```

---

## 🔧 Service Layer Pattern

Services contain all business logic. They depend only on repository interfaces (never on Appwrite SDK directly).

### TransactionService

```typescript
// src/lib/services/transaction.service.ts

import type {
  ITransactionRepository,
  IVendorCacheRepository,
  TransactionQueryOptions,
  PaginatedResult,
} from '@/lib/repositories/interfaces';
import type { Transaction, TransactionCreate, TransactionUpdate } from '@/types/transaction';

export class TransactionService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly vendorCacheRepo: IVendorCacheRepository,
  ) {}

  async listTransactions(userId: string, options: TransactionQueryOptions): Promise<PaginatedResult<Transaction>> {
    return this.transactionRepo.findByUserId(userId, options);
  }

  async getTransaction(userId: string, transactionId: string): Promise<Transaction> {
    const tx = await this.transactionRepo.findById(transactionId);
    if (!tx || tx.userId !== userId) {
      throw new NotFoundError(`Transaction ${transactionId} not found`);
    }
    return tx;
  }

  async createManualTransaction(userId: string, data: {
    amount: number;
    vendor: string;
    categoryId: string;
    transactionDate: string;
    description?: string;
  }): Promise<Transaction> {
    // Business rule: validate amount > 0
    if (data.amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    const transaction = await this.transactionRepo.create({
      user_id: userId,
      category_id: data.categoryId,
      amount: data.amount,
      vendor: data.vendor,
      description: data.description || '',
      transaction_date: data.transactionDate,
      resend_email_id: null,
      raw_email_subject: '',
      confidence: 'high', // Manual entries are always high confidence
      source: 'manual',
    });

    // Business rule: update vendor cache for manual entries too
    const normalizedVendor = data.vendor.toUpperCase().trim();
    const cached = await this.vendorCacheRepo.findByUserAndVendor(userId, normalizedVendor);
    if (!cached) {
      await this.vendorCacheRepo.create(userId, normalizedVendor, data.categoryId);
    }

    return transaction;
  }

  async updateTransaction(userId: string, transactionId: string, data: TransactionUpdate): Promise<Transaction> {
    const existing = await this.getTransaction(userId, transactionId);

    // Business rule: if category changes, update vendor cache
    if (data.category_id && data.category_id !== existing.categoryId) {
      const normalizedVendor = existing.vendor.toUpperCase().trim();
      const cached = await this.vendorCacheRepo.findByUserAndVendor(userId, normalizedVendor);
      if (cached) {
        // User is correcting the AI — update the cache so future transactions are correct
        await this.vendorCacheRepo.create(userId, normalizedVendor, data.category_id);
      }
    }

    return this.transactionRepo.update(transactionId, data);
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    await this.getTransaction(userId, transactionId); // ownership check
    await this.transactionRepo.delete(transactionId);
  }

  async isDuplicate(resendEmailId: string): Promise<boolean> {
    const existing = await this.transactionRepo.findByResendEmailId(resendEmailId);
    return existing !== null;
  }
}

// --- Custom Error Classes ---
export class NotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'NotFoundError'; }
}

export class ValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'ValidationError'; }
}
```

### WebhookService

```typescript
// src/lib/services/webhook.service.ts

import type { ITransactionRepository, IVendorCacheRepository } from '@/lib/repositories/interfaces';
import type { ExpenseAgent } from '@/lib/agent/graph';

export class WebhookService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly vendorCacheRepo: IVendorCacheRepository,
    private readonly agent: ExpenseAgent,
  ) {}

  /**
   * Process an inbound email webhook event.
   * Returns the transaction ID if successful, or null if skipped (duplicate).
   */
  async processInboundEmail(params: {
    emailHtml: string;
    emailText: string;
    emailSubject: string;
    emailDate: string;
    resendEmailId: string;
    userId: string;
  }): Promise<{ transactionId: string } | { status: 'duplicate' | 'cached' }> {
    // 1. Dedup check
    const existing = await this.transactionRepo.findByResendEmailId(params.resendEmailId);
    if (existing) return { status: 'duplicate' };

    // 2. Vendor cache fast path (regex extraction)
    const roughVendor = this.extractRoughVendor(params.emailText);
    if (roughVendor) {
      const cached = await this.vendorCacheRepo.findByUserAndVendor(params.userId, roughVendor);
      if (cached) {
        const tx = await this.transactionRepo.create({
          user_id: params.userId,
          category_id: cached.categoryId,
          amount: this.extractRoughAmount(params.emailText) || 0,
          vendor: roughVendor,
          description: '',
          transaction_date: params.emailDate,
          resend_email_id: params.resendEmailId,
          raw_email_subject: params.emailSubject,
          confidence: 'high',
          source: 'email',
        });
        await this.vendorCacheRepo.incrementHitCount(cached.id, cached.hitCount);
        return { status: 'cached' };
      }
    }

    // 3. Full agent invocation
    const result = await this.agent.invoke(params);
    return { transactionId: result.transactionId };
  }

  private extractRoughVendor(text: string): string | null {
    const match = text.match(/at\s+([A-Z0-9\s.*]+?)[\.\s]*(?:If|$)/i);
    return match?.[1]?.toUpperCase().trim() || null;
  }

  private extractRoughAmount(text: string): number | null {
    const match = text.match(/SGD\s*([\d,]+\.\d{2})/i);
    return match ? parseFloat(match[1].replace(',', '')) : null;
  }
}
```

### DashboardService

```typescript
// src/lib/services/dashboard.service.ts

import type { ITransactionRepository, IBudgetRepository, ICategoryRepository } from '@/lib/repositories/interfaces';
import { getMonthRange } from '@/lib/utils/date';

export interface DashboardSummary {
  totalSpent: number;
  totalBudget: number;
  percentUsed: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    icon: string;
    color: string;
    spent: number;
    budget: number;
    percentUsed: number;
    status: 'on_track' | 'warning' | 'over_budget';
  }>;
  recentTransactions: Array<{
    id: string;
    vendor: string;
    amount: number;
    categoryName: string;
    categoryIcon: string;
    transactionDate: string;
    confidence: string;
  }>;
}

export interface BudgetAlert {
  categoryName: string;
  icon: string;
  type: 'warning' | 'over_budget';
  percentUsed: number;
  amountOver: number;
}

export class DashboardService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly budgetRepo: IBudgetRepository,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async getSummary(userId: string, year: number, month: number): Promise<DashboardSummary> {
    const { start, end } = getMonthRange(year, month);

    const [transactions, budgets, categories] = await Promise.all([
      this.transactionRepo.findByUserAndDateRange(userId, start, end),
      this.budgetRepo.findByUserAndPeriod(userId, year, month),
      this.categoryRepo.findByUserId(userId),
    ]);

    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const budgetMap = new Map(budgets.map(b => [b.categoryId, b]));

    // Aggregate spending per category
    const spendingMap = new Map<string, number>();
    for (const tx of transactions) {
      spendingMap.set(tx.categoryId, (spendingMap.get(tx.categoryId) || 0) + tx.amount);
    }

    const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

    const categoryBreakdown = categories.map(cat => {
      const spent = spendingMap.get(cat.id) || 0;
      const budget = budgetMap.get(cat.id)?.amount || 0;
      const percentUsed = budget > 0 ? (spent / budget) * 100 : (spent > 0 ? Infinity : 0);
      const status = percentUsed >= 100 ? 'over_budget' : percentUsed >= 80 ? 'warning' : 'on_track';

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        icon: cat.icon,
        color: cat.color,
        spent,
        budget,
        percentUsed,
        status: status as 'on_track' | 'warning' | 'over_budget',
      };
    });

    // Recent transactions (last 10)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 10)
      .map(tx => ({
        id: tx.id,
        vendor: tx.vendor,
        amount: tx.amount,
        categoryName: categoryMap.get(tx.categoryId)?.name || 'Unknown',
        categoryIcon: categoryMap.get(tx.categoryId)?.icon || '📦',
        transactionDate: tx.transactionDate,
        confidence: tx.confidence,
      }));

    return {
      totalSpent,
      totalBudget,
      percentUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      categoryBreakdown,
      recentTransactions,
    };
  }

  async getAlerts(userId: string, year: number, month: number): Promise<BudgetAlert[]> {
    const summary = await this.getSummary(userId, year, month);
    return summary.categoryBreakdown
      .filter(c => c.status !== 'on_track' && c.budget > 0)
      .map(c => ({
        categoryName: c.categoryName,
        icon: c.icon,
        type: c.status as 'warning' | 'over_budget',
        percentUsed: c.percentUsed,
        amountOver: c.spent - c.budget,
      }))
      .sort((a, b) => b.percentUsed - a.percentUsed);
  }
}
```

---

## 🎯 Strategy Pattern (Agent Categorization)

The 5-tier certainty escalation is modeled as a chain of strategies:

```typescript
// src/lib/agent/strategies/categorization.ts

export interface CategorizationContext {
  vendor: string;
  emailText: string;
  userId: string;
  categories: Array<{ id: string; name: string; description: string }>;
}

export interface CategoryMatch {
  categoryId: string;
  categoryName: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CategorizationStrategy {
  name: string;
  resolve(context: CategorizationContext): Promise<CategoryMatch | null>;
}

// --- Strategy Implementations ---

export class VendorCacheStrategy implements CategorizationStrategy {
  name = 'vendor_cache';

  constructor(private vendorCacheRepo: IVendorCacheRepository) {}

  async resolve(context: CategorizationContext): Promise<CategoryMatch | null> {
    const normalizedVendor = context.vendor.toUpperCase().trim();
    const cached = await this.vendorCacheRepo.findByUserAndVendor(context.userId, normalizedVendor);
    if (!cached) return null;

    const category = context.categories.find(c => c.id === cached.categoryId);
    return category
      ? { categoryId: category.id, categoryName: category.name, confidence: 'high' }
      : null;
  }
}

export class Mem0MemoryStrategy implements CategorizationStrategy {
  name = 'mem0_memory';

  constructor(private mem0Client: MemoryClient) {}

  async resolve(context: CategorizationContext): Promise<CategoryMatch | null> {
    const memories = await this.mem0Client.search(
      `How should I categorize ${context.vendor}?`,
      { user_id: context.userId, limit: 3 }
    );

    if (!memories.results?.length) return null;

    // Parse memory to find category preference
    const memoryText = memories.results.map((m: { memory: string }) => m.memory).join(' ');
    const matchedCategory = context.categories.find(c =>
      memoryText.toLowerCase().includes(c.name.toLowerCase())
    );

    return matchedCategory
      ? { categoryId: matchedCategory.id, categoryName: matchedCategory.name, confidence: 'high' }
      : null;
  }
}

export class LLMCategoryMatchStrategy implements CategorizationStrategy {
  name = 'llm_category_match';

  constructor(private llm: ChatOpenAI) {}

  async resolve(context: CategorizationContext): Promise<CategoryMatch | null> {
    // LLM reasons over vendor + category descriptions
    // Returns match if confidence >= 0.8
    // Implementation delegates to the LangGraph agent's extract + lookup tools
    return null; // implemented inside the agent graph
  }
}

export class BraveSearchStrategy implements CategorizationStrategy {
  name = 'brave_search';

  constructor(private braveSearchApiKey: string) {}

  async resolve(context: CategorizationContext): Promise<CategoryMatch | null> {
    // Web search for unknown vendor, re-evaluate with search context
    // Returns match if confidence >= 0.6 after search
    return null; // implemented inside the agent graph
  }
}

export class FallbackOtherStrategy implements CategorizationStrategy {
  name = 'fallback_other';

  async resolve(context: CategorizationContext): Promise<CategoryMatch | null> {
    const otherCategory = context.categories.find(c => c.name === 'Other');
    return otherCategory
      ? { categoryId: otherCategory.id, categoryName: 'Other', confidence: 'low' }
      : null;
  }
}

// --- Strategy Chain ---

export class CategorizationChain {
  private strategies: CategorizationStrategy[];

  constructor(strategies: CategorizationStrategy[]) {
    this.strategies = strategies;
  }

  async resolve(context: CategorizationContext): Promise<CategoryMatch> {
    for (const strategy of this.strategies) {
      const result = await strategy.resolve(context);
      if (result) {
        console.log(`[Categorization] Resolved by ${strategy.name}: ${result.categoryName} (${result.confidence})`);
        return result;
      }
    }

    // Should never reach here if FallbackOtherStrategy is last
    throw new Error('No categorization strategy could resolve the vendor');
  }
}
```

---

## 🔧 Configuration Pattern

```typescript
// src/lib/config/app.config.ts

export interface AppConfig {
  appwrite: {
    endpoint: string;
    projectId: string;
    apiKey: string;
    databaseId: string;
  };
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
    maxRetries: number;
    timeoutMs: number;
  };
  braveSearch: {
    apiKey: string;
    smitheryUrl: string;
    maxResults: number;
  };
  resend: {
    apiKey: string;
    webhookSecret: string;
  };
  budget: {
    warningThresholdPercent: number;   // 80
    overBudgetThresholdPercent: number; // 100
  };
  agent: {
    maxRetries: number;    // 1
    timeoutMs: number;     // 30000
    cacheEnabled: boolean; // true
  };
}

export function loadConfig(): AppConfig {
  return {
    appwrite: {
      endpoint: requireEnv('APPWRITE_ENDPOINT'),
      projectId: requireEnv('APPWRITE_PROJECT_ID'),
      apiKey: requireEnv('APPWRITE_API_KEY'),
      databaseId: requireEnv('APPWRITE_DATABASE_ID'),
    },
    openai: {
      apiKey: requireEnv('OPENAI_API_KEY'),
      model: process.env.OPENAI_MODEL || 'gpt-5.1',
      temperature: 0,
      maxRetries: 2,
      timeoutMs: 30_000,
    },
    braveSearch: {
      apiKey: requireEnv('BRAVE_SEARCH_API_KEY'),
      smitheryUrl: 'https://server.smithery.ai/brave',
      maxResults: 3,
    },
    resend: {
      apiKey: requireEnv('RESEND_API_KEY'),
      webhookSecret: requireEnv('RESEND_WEBHOOK_SECRET'),
    },
    budget: {
      warningThresholdPercent: 80,
      overBudgetThresholdPercent: 100,
    },
    agent: {
      maxRetries: 1,
      timeoutMs: 30_000,
      cacheEnabled: true,
    },
  };
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}
```

---

## 📐 Project Structure (Updated with Patterns)

```
src/lib/
├── appwrite/
│   ├── client.ts                  ← Appwrite client singleton (browser)
│   ├── server.ts                  ← Server-side Appwrite client
│   └── config.ts                  ← DB IDs, table IDs
├── repositories/
│   ├── interfaces.ts              ← Repository interfaces (contracts)
│   ├── appwrite/                  ← Production implementations
│   │   ├── transaction.repository.ts
│   │   ├── category.repository.ts
│   │   ├── budget.repository.ts
│   │   └── vendor-cache.repository.ts
│   └── in-memory/                 ← Test implementations
│       ├── transaction.repository.ts
│       ├── category.repository.ts
│       ├── budget.repository.ts
│       └── vendor-cache.repository.ts
├── services/
│   ├── transaction.service.ts
│   ├── category.service.ts
│   ├── budget.service.ts
│   ├── dashboard.service.ts
│   └── webhook.service.ts
├── factories/
│   ├── agent.factory.ts
│   └── repository.factory.ts
├── di/
│   └── container.ts               ← DI container / injector
├── agent/
│   ├── graph.ts                   ← LangGraph.js agent definition
│   ├── state.ts                   ← Agent state schema
│   ├── commands/
│   │   └── process-email.command.ts ← Command pattern for email pipeline
│   ├── strategies/
│   │   └── categorization.ts      ← Strategy pattern for categorization
│   ├── tools/
│   │   ├── extract-expense.ts
│   │   ├── lookup-categories.ts
│   │   ├── brave-search.ts
│   │   └── log-expense.ts
│   └── prompts.ts
├── config/
│   └── app.config.ts              ← Centralized typed config
├── auth/
│   └── middleware.ts              ← Auth guard
└── utils/
    ├── date.ts
    ├── currency.ts
    └── vendor.ts
```

---

## 📊 Pattern Summary

| Pattern | Where Used | Purpose |
|---------|-----------|---------|
| **Repository** | `src/lib/repositories/` | Abstracts data access. Appwrite production, InMemory for tests. |
| **Service** | `src/lib/services/` | Business logic layer. Depends on repository interfaces only. |
| **Factory** | `src/lib/factories/` | Creates complex objects (agents, repository sets). |
| **Dependency Injection** | `src/lib/di/container.ts` | Wires dependencies per-request. API routes call `createContainer()`. |
| **Strategy** | `src/lib/agent/strategies/` | 5-tier categorization escalation chain (Vendor Cache → Mem0 → LLM → Brave Search → Fallback). |
| **Command** | `src/lib/agent/commands/` | Encapsulates multi-step AI workflows as discrete, testable units. |
| **Configuration** | `src/lib/config/app.config.ts` | Typed, centralized config with env var validation. |
| **Singleton** | `src/lib/appwrite/client.ts` | Single Appwrite client instance per runtime. |

---

## 🔄 Comparative Validation & Architectural Decisions

> This section documents how Aura's architecture was validated against a comparative analysis of two production codebases: **tcs-core** (Azure Functions, CosmosDB, enterprise/government context) and **aibots-api** (FastAPI, MongoDB/Beanie ODM, AI agents platform). The analysis recommended a hybrid approach for AI agent backends. Below we evaluate each recommendation against Aura's choices with critical scrutiny.

### Alignment With Hybrid Recommendations

| Recommendation | Aura's Decision | Verdict |
|---|---|---|
| **Explicit constructor DI** (from tcs-core) | ✅ `createContainer()` with constructor injection — [ADR-007](../ADR/ADR-007-dependency-injection.md) | **Validated.** Aura's DI is explicit and zero-dependency. Every service receives its repositories through constructor params. No runtime registry magic, no decorator metadata issues with Next.js RSC/Edge. |
| **Repository pattern over Active Record** (from tcs-core) | ✅ Interface-based repositories — [ADR-009](../ADR/ADR-009-repository-pattern.md) | **Validated.** `ITransactionRepository` + `AppwriteTransactionRepository` + `InMemoryTransactionRepository` is exactly the pattern recommended. |
| **Strategy pattern for AI operations** | ✅ 5-tier categorization chain — [ADR-013](../ADR/ADR-013-strategy-pattern.md) | **Validated.** Aura's `CategorizationChain` is a textbook Strategy + Chain of Responsibility. |
| **Factory pattern** | ✅ `AgentFactory` + `RepositoryFactory` — [ADR-010](../ADR/ADR-010-factory-pattern.md) | **Validated.** Both production and test creation paths are encapsulated. |
| **Service layer** | ✅ 5 service classes — [ADR-008](../ADR/ADR-008-service-layer-pattern.md) | **Validated.** Business logic centralized, API routes stay thin. |
| **2-tier models** | ✅ Domain types + API response types | **Validated.** Simpler than tcs-core's 3-tier (Route → DB → Web) without sacrificing type safety. |

### Recommendations Critically Rejected

#### ❌ FastAPI as Framework

The report recommends FastAPI for AI agent backends. **Rejected for Aura.**

- Aura is **TypeScript end-to-end** ([ADR-011](../ADR/ADR-011-typescript-language.md)). Introducing Python (FastAPI) creates a polyglot codebase with separate type systems, separate toolchains, separate deploy pipelines — for a single-developer project.
- Next.js API Routes provide the same key benefits: async handlers, request validation (via Zod), and OpenAPI generation (via `next-swagger-doc` or `zod-to-openapi`).
- The AI agent (LangGraph.js) runs in the **same TypeScript runtime** as the API routes. No cross-language serialization, no gRPC bridge, no separate Python microservice.
- FastAPI's advantages (Depends, Pydantic, OpenAPI auto-gen) are replicated in TypeScript via Zod schemas, custom DI container, and Next.js's built-in request handling.

**Verdict:** FastAPI is a strong choice for Python-native AI backends. For Aura's full-stack TypeScript architecture, Next.js API Routes are the correct choice.

#### ❌ Mixin Composition at API Layer

The report recommends mixin-based class composition for API routes (e.g., `class AgentAPI(AuthMixin, AgentMixin)`). **Rejected for Aura.**

- Next.js API Routes are **functions, not classes**. The mixin pattern (multiple inheritance via `class API(Mixin1, Mixin2)`) has no clean equivalent in function-based route handlers.
- Aura achieves the same composability through **middleware + higher-order functions**: auth middleware wraps routes, the DI container provides services, and route handlers are < 20 lines.
- Mixin MRO (Method Resolution Order) complexity is a known footgun. The report itself lists "MRO can be confusing" as a con. For 10 API endpoints, the complexity cost exceeds the composition benefit.
- TypeScript's type system with interfaces and composition provides the same code reuse without Python's MRO pitfalls.

**Verdict:** Mixins solve a problem Aura doesn't have. Function composition + middleware achieves the same result with less cognitive overhead.

### Recommendation Adopted: Command Pattern for AI Workflows

The report makes a compelling case for the **Command pattern** to encapsulate multi-step AI operations. This is the one significant gap in Aura's current architecture.

**Problem:** `WebhookService.processInboundEmail()` currently executes a 3-phase pipeline inline:
1. Dedup check (is this email already processed?)
2. Vendor cache fast-path (can we short-circuit the agent?)
3. Full agent invocation (LangGraph state machine)

This works but has limitations:
- **Observability** — No structured logging of which phase resolved the transaction
- **Retry granularity** — If the agent fails at step 3, the entire method must be retried (including redundant dedup/cache checks)
- **Extensibility** — Adding a new pipeline step (e.g., Mem0 feedback recall) requires modifying `WebhookService` directly

**Adopted approach:** Formalize the email processing pipeline as a Command:

```typescript
// src/lib/agent/commands/process-email.command.ts

export interface CommandResult<T> {
  success: boolean;
  data: T;
  resolvedBy: string;  // Which step resolved the request
  durationMs: number;
}

export class ProcessEmailCommand {
  constructor(
    private readonly params: InboundEmailParams,
    private readonly transactionRepo: ITransactionRepository,
    private readonly vendorCacheRepo: IVendorCacheRepository,
    private readonly agent: ExpenseAgent,
  ) {}

  async execute(): Promise<CommandResult<{ transactionId: string } | { status: 'duplicate' | 'cached' }>> {
    const start = Date.now();

    // Phase 1: Dedup
    const existing = await this.transactionRepo.findByResendEmailId(this.params.resendEmailId);
    if (existing) {
      return { success: true, data: { status: 'duplicate' }, resolvedBy: 'dedup', durationMs: Date.now() - start };
    }

    // Phase 2: Vendor cache fast-path
    const roughVendor = extractRoughVendor(this.params.emailText);
    if (roughVendor) {
      const cached = await this.vendorCacheRepo.findByUserAndVendor(this.params.userId, roughVendor);
      if (cached) {
        const tx = await this.transactionRepo.create({ /* ... */ });
        await this.vendorCacheRepo.incrementHitCount(cached.id, cached.hitCount);
        return { success: true, data: { status: 'cached' }, resolvedBy: 'vendor_cache', durationMs: Date.now() - start };
      }
    }

    // Phase 3: Full agent invocation
    const result = await this.agent.invoke(this.params);
    return { success: true, data: { transactionId: result.transactionId }, resolvedBy: 'agent', durationMs: Date.now() - start };
  }
}
```

**Why this matters for AI backends specifically:**
- Each command is independently testable (test dedup path, test cache path, test agent path)
- `resolvedBy` field enables observability dashboards (what % of emails hit the cache vs the agent?)
- `durationMs` enables performance monitoring per resolution strategy
- New commands (e.g., `ReprocessTransactionCommand`, `BulkCategorizeCommand`) can be added without modifying services

**Why NOT use Command for everything:** Commands excel at multi-step orchestration. Simple CRUD operations (list transactions, create budget) remain in services. Over-commanding leads to the same class explosion that Use Case/Interactor patterns suffer from. See [ADR-008](../ADR/ADR-008-service-layer-pattern.md) Option C for why we rejected that.

### Critical Counter-Arguments to the Report

The report contains several claims that deserve scrutiny when applied to Aura:

1. **"Repository pattern is crucial for AI data patterns — Vector similarity search, hybrid search, and multi-modal queries don't fit Active Record well."**
   - **Skepticism:** Aura's primary data access is standard CRUD (transactions, categories, budgets). Vector search happens inside external services (Mem0 for feedback memory, Brave Search MCP for web lookup) — not in Aura's repositories. The Repository pattern is justified for Aura, but for **testability and migration flexibility**, not for vector search abstraction.

2. **"AI backends need explicit dependency management — LLM clients, vector stores, and memory systems have complex configuration that shouldn't be hidden in magic registries."**
   - **Agree**, but with nuance. Aura's AI dependencies (OpenAI client, Brave Search) are wired through `AgentFactory`, which is called inside `createContainer()`. The configuration is explicit but the agent's internal dependency graph is managed by LangGraph's state machine, not by our DI container. This is the correct boundary — DI manages service-level wiring, LangGraph manages agent-internal orchestration.

3. **"Strategy pattern is essential for AI backends — You'll swap between models (GPT-4, Claude, Llama) frequently."**
   - **Skepticism for V1:** Aura uses GPT-5.1 exclusively. Multi-model support is a V2 concern. The Strategy pattern IS used in Aura, but for **categorization tier escalation** (a much more immediate concern). Premature abstraction for model swapping would add complexity without current payoff. See [ADR-013](../ADR/ADR-013-strategy-pattern.md) for V2 expansion notes.

---

## ✅ Testing Benefits

The design patterns above enable:

1. **Unit tests with zero external dependencies** — Inject `InMemory` repositories into services.
2. **Fast test execution** — No network calls, no database setup.
3. **Isolated agent testing** — `AgentFactory.createForTesting()` returns an agent with mocked tools.
4. **Integration tests with real Appwrite** — Swap `InMemory` for `Appwrite` repositories pointing at a test database.
5. **Strategy testing** — Each categorization strategy is independently testable.

```typescript
// Example: Unit testing TransactionService
import { TransactionService } from '@/lib/services/transaction.service';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import { InMemoryVendorCacheRepository } from '@/lib/repositories/in-memory/vendor-cache.repository';

const txRepo = new InMemoryTransactionRepository();
const vcRepo = new InMemoryVendorCacheRepository();
const service = new TransactionService(txRepo, vcRepo);

// Now test business logic without touching Appwrite or any network
```
