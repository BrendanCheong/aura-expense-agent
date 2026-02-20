/**
 * Dependency Injection container.
 * Wires together repositories, services, and the agent.
 *
 * Production: Uses Appwrite-backed repositories and real agent.
 * Testing: Uses in-memory repositories and mock agent.
 */

import type { IExpenseAgent } from '@/lib/agent/interfaces';
import type { IEmailProvider } from '@/lib/resend/interfaces';

import { getAppwriteServer } from '@/lib/appwrite/server';
import { type Repositories, RepositoryFactory } from '@/lib/factories/repository.factory';
import { AuthService } from '@/lib/services/auth.service';
import { BudgetService } from '@/lib/services/budget.service';
import { CategoryService } from '@/lib/services/category.service';
import { DashboardService } from '@/lib/services/dashboard.service';
import { TransactionService } from '@/lib/services/transaction.service';
import { WebhookService } from '@/lib/services/webhook.service';

export interface ServiceContainer {
  transactionService: TransactionService;
  categoryService: CategoryService;
  budgetService: BudgetService;
  dashboardService: DashboardService;
  webhookService: WebhookService;
  authService: AuthService;
  emailProvider: IEmailProvider;
  vendorCacheRepo: import('@/lib/repositories/interfaces').IVendorCacheRepository;
}

/** Cached container instance (singleton per server lifetime). */
let containerPromise: Promise<ServiceContainer> | null = null;

function buildContainer(repos: Repositories, agent: IExpenseAgent, emailProvider: IEmailProvider): ServiceContainer {
  const transactionService = new TransactionService(repos.transactions, repos.vendorCache);
  const categoryService = new CategoryService(
    repos.categories,
    repos.vendorCache,
    repos.budgets,
    repos.transactions
  );
  const budgetService = new BudgetService(repos.budgets, repos.transactions);
  const dashboardService = new DashboardService(
    repos.transactions,
    repos.budgets,
    repos.categories
  );
  const webhookService = new WebhookService(repos.transactions, repos.vendorCache, repos.users, agent);
  const authService = new AuthService(repos.users, repos.categories);

  return {
    transactionService,
    categoryService,
    budgetService,
    dashboardService,
    webhookService,
    authService,
    emailProvider,
    vendorCacheRepo: repos.vendorCache,
  };
}

/**
 * Create (or return cached) production service container
 * backed by Appwrite TablesDB repositories.
 */
export function createContainer(): Promise<ServiceContainer> {
  if (!containerPromise) {
    containerPromise = (async () => {
      const { tablesDb } = getAppwriteServer();
      const repos = await RepositoryFactory.createAppwrite(tablesDb);

      // Lazy-import production implementations to avoid pulling in
      // LangChain/OpenAI/Resend at module load time (helps tree-shaking & tests).
      const { LangGraphExpenseAgent } = await import('@/lib/agent/langgraph-agent');
      const { ResendEmailProvider } = await import('@/lib/resend/client');

      const agent: IExpenseAgent = new LangGraphExpenseAgent();
      const emailProvider: IEmailProvider = new ResendEmailProvider();

      return buildContainer(repos, agent, emailProvider);
    })();
  }
  return containerPromise;
}

/**
 * Reset the cached container (used in tests or hot-reload).
 */
export function resetContainer(): void {
  containerPromise = null;
}

/**
 * Create a test container with in-memory repositories.
 * No external dependencies (no Appwrite, no OpenAI, no Brave Search).
 * Agent and email provider must be injected for webhook tests.
 */
export async function createTestContainer(overrides?: {
  agent?: IExpenseAgent;
  emailProvider?: IEmailProvider;
}): Promise<ServiceContainer & { repos: Repositories }> {
  const repos = await RepositoryFactory.createInMemory();

  // Default no-op implementations for tests that don't need agent/email
  const noopAgent: IExpenseAgent = {
    processEmail: () => Promise.resolve({
      transactionId: null,
      vendor: null,
      amount: null,
      categoryId: null,
      categoryName: null,
      confidence: null,
      transactionDate: null,
      error: null,
    }),
  };
  const noopEmailProvider: IEmailProvider = {
    getReceivedEmail: () => Promise.resolve(null),
  };

  const agent = overrides?.agent ?? noopAgent;
  const emailProvider = overrides?.emailProvider ?? noopEmailProvider;

  return { ...buildContainer(repos, agent, emailProvider), repos };
}
