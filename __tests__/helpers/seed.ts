/**
 * Shared test seed helper — loads JSON fixtures into InMemory repositories.
 *
 * Eliminates duplicated seed functions across test files.
 * Each function maps snake_case fixture data to camelCase domain objects.
 *
 * Usage:
 *   import { seedAll, resetAll } from '../../helpers/seed';
 *   beforeEach(() => seedAll(repos));
 *   afterEach(() => resetAll(repos));
 */

import budgetsFixture from '../fixtures/budgets.json';
import categoriesFixture from '../fixtures/categories.json';
import transactionsFixture from '../fixtures/transactions.json';
import usersFixture from '../fixtures/users.json';
import vendorCacheFixture from '../fixtures/vendor-cache.json';

import type { OAuthProvider, BudgetMode } from '@/lib/enums';
import type { InMemoryBudgetRepository } from '@/lib/repositories/in-memory/budget.repository';
import type { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import type { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import type { InMemoryUserRepository } from '@/lib/repositories/in-memory/user.repository';
import type { InMemoryVendorCacheRepository } from '@/lib/repositories/in-memory/vendor-cache.repository';
import type { Transaction } from '@/types/transaction';

// ---------------------------------------------------------------------------
// Repository type bundle (for seedAll / resetAll)
// ---------------------------------------------------------------------------

export interface TestRepositories {
  transactionRepo: InMemoryTransactionRepository;
  categoryRepo: InMemoryCategoryRepository;
  userRepo: InMemoryUserRepository;
  vendorCacheRepo: InMemoryVendorCacheRepository;
  budgetRepo: InMemoryBudgetRepository;
}

// ---------------------------------------------------------------------------
// Individual seed functions
// ---------------------------------------------------------------------------

export function seedUsers(userRepo: InMemoryUserRepository): void {
  for (const user of Object.values(usersFixture)) {
    userRepo.seed({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      inboundEmail: user.inbound_email,
      oauthProvider: user.oauth_provider as OAuthProvider,
      monthlySalary: user.monthly_salary,
      budgetMode: user.budget_mode as BudgetMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function seedCategories(categoryRepo: InMemoryCategoryRepository): void {
  for (const cat of categoriesFixture) {
    categoryRepo.seed({
      id: cat.id,
      userId: cat.user_id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
      isDefault: cat.is_default,
      sortOrder: cat.sort_order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function seedTransactions(transactionRepo: InMemoryTransactionRepository): void {
  for (const tx of transactionsFixture) {
    transactionRepo.seed({
      id: tx.id,
      userId: tx.user_id,
      categoryId: tx.category_id,
      amount: tx.amount,
      vendor: tx.vendor,
      description: tx.description,
      transactionDate: tx.transaction_date,
      resendEmailId: tx.resend_email_id,
      rawEmailSubject: tx.raw_email_subject,
      confidence: tx.confidence as Transaction['confidence'],
      source: tx.source as Transaction['source'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function seedVendorCache(vendorCacheRepo: InMemoryVendorCacheRepository): void {
  for (const vc of vendorCacheFixture) {
    vendorCacheRepo.seed({
      id: vc.id,
      userId: vc.user_id,
      vendorName: vc.vendor_name,
      categoryId: vc.category_id,
      hitCount: vc.hit_count,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function seedBudgets(budgetRepo: InMemoryBudgetRepository): void {
  for (const b of budgetsFixture) {
    budgetRepo.seed({
      id: b.id,
      userId: b.user_id,
      categoryId: b.category_id,
      amount: b.amount,
      year: b.year,
      month: b.month,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

// ---------------------------------------------------------------------------
// Composite helpers
// ---------------------------------------------------------------------------

/**
 * Seed all repositories from JSON fixtures.
 * Call in beforeEach() for a fresh dataset per test.
 */
export function seedAll(repos: TestRepositories): void {
  seedUsers(repos.userRepo);
  seedCategories(repos.categoryRepo);
  seedTransactions(repos.transactionRepo);
  seedVendorCache(repos.vendorCacheRepo);
  seedBudgets(repos.budgetRepo);
}

/**
 * Reset (clear) all repositories.
 * Call in afterEach() or at the start of beforeEach() before re-seeding.
 */
export function resetAll(repos: TestRepositories): void {
  repos.transactionRepo.reset();
  repos.categoryRepo.reset();
  repos.userRepo.reset();
  repos.vendorCacheRepo.reset();
  repos.budgetRepo.reset();
}

// ---------------------------------------------------------------------------
// Re-export fixtures for direct access in tests
// ---------------------------------------------------------------------------

export {
  categoriesFixture,
  transactionsFixture,
  usersFixture,
  vendorCacheFixture,
  budgetsFixture,
};
