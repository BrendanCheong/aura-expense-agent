/**
 * Dependency Injection container.
 * Wires together repositories, services, and the agent.
 *
 * Production: Uses Appwrite-backed repositories and real agent.
 * Testing: Uses in-memory repositories and mock agent.
 */

import { RepositoryFactory, type Repositories } from '@/lib/factories/repository.factory';
import { TransactionService } from '@/lib/services/transaction.service';
import { CategoryService } from '@/lib/services/category.service';
import { BudgetService } from '@/lib/services/budget.service';
import { DashboardService } from '@/lib/services/dashboard.service';
import { WebhookService } from '@/lib/services/webhook.service';
import { AuthService } from '@/lib/services/auth.service';
import { getAppwriteServer } from '@/lib/appwrite/server';

export interface ServiceContainer {
  transactionService: TransactionService;
  categoryService: CategoryService;
  budgetService: BudgetService;
  dashboardService: DashboardService;
  webhookService: WebhookService;
  authService: AuthService;
}

/** Cached container instance (singleton per server lifetime). */
let containerPromise: Promise<ServiceContainer> | null = null;

function buildContainer(repos: Repositories): ServiceContainer {
  const transactionService = new TransactionService(repos.transactions, repos.vendorCache);
  const categoryService = new CategoryService(repos.categories, repos.vendorCache, repos.budgets);
  const budgetService = new BudgetService(repos.budgets, repos.transactions);
  const dashboardService = new DashboardService(repos.transactions, repos.budgets, repos.categories);
  const webhookService = new WebhookService(repos.transactions, repos.vendorCache, null);
  const authService = new AuthService(repos.users, repos.categories);

  return {
    transactionService,
    categoryService,
    budgetService,
    dashboardService,
    webhookService,
    authService,
  };
}

/**
 * Create (or return cached) production service container
 * backed by Appwrite TablesDB repositories.
 */
export async function createContainer(): Promise<ServiceContainer> {
  if (!containerPromise) {
    containerPromise = (async () => {
      const { tablesDb } = getAppwriteServer();
      const repos = await RepositoryFactory.createAppwrite(tablesDb);
      return buildContainer(repos);
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
 */
export async function createTestContainer(): Promise<ServiceContainer & { repos: Repositories }> {
  const repos = await RepositoryFactory.createInMemory();
  return { ...buildContainer(repos), repos };
}
