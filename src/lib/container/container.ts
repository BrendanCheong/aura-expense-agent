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

export interface ServiceContainer {
  transactionService: TransactionService;
  categoryService: CategoryService;
  budgetService: BudgetService;
  dashboardService: DashboardService;
  webhookService: WebhookService;
}

/**
 * Create a fully wired service container for the current request.
 * Will use Appwrite repositories once FEAT-002 is implemented.
 */
export function createContainer(): ServiceContainer {
  // TODO: Wire with Appwrite in FEAT-002
  throw new Error('Production container not yet configured. See FEAT-002.');
}

/**
 * Create a test container with in-memory repositories.
 * No external dependencies (no Appwrite, no OpenAI, no Brave Search).
 */
export async function createTestContainer(): Promise<ServiceContainer & { repos: Repositories }> {
  const repos = await RepositoryFactory.createInMemory();

  const transactionService = new TransactionService(repos.transactions, repos.vendorCache);
  const categoryService = new CategoryService(repos.categories, repos.vendorCache, repos.budgets);
  const budgetService = new BudgetService(repos.budgets, repos.transactions);
  const dashboardService = new DashboardService(repos.transactions, repos.budgets, repos.categories);
  const webhookService = new WebhookService(repos.transactions, repos.vendorCache, null);

  return {
    transactionService,
    categoryService,
    budgetService,
    dashboardService,
    webhookService,
    repos,
  };
}
