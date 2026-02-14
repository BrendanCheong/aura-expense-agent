/**
 * Repository factory — creates repository instances.
 *
 * Production: Appwrite-backed repositories.
 * Testing: In-memory repositories.
 */

import type {
  ITransactionRepository,
  ICategoryRepository,
  IBudgetRepository,
  IVendorCacheRepository,
} from '@/lib/repositories/interfaces';

export interface Repositories {
  transactions: ITransactionRepository;
  categories: ICategoryRepository;
  budgets: IBudgetRepository;
  vendorCache: IVendorCacheRepository;
}

export class RepositoryFactory {
  /**
   * Create in-memory repositories for testing.
   */
  static async createInMemory(): Promise<Repositories> {
    const [
      { InMemoryTransactionRepository },
      { InMemoryCategoryRepository },
      { InMemoryBudgetRepository },
      { InMemoryVendorCacheRepository },
    ] = await Promise.all([
      import('@/lib/repositories/in-memory/transaction.repository'),
      import('@/lib/repositories/in-memory/category.repository'),
      import('@/lib/repositories/in-memory/budget.repository'),
      import('@/lib/repositories/in-memory/vendor-cache.repository'),
    ]);

    return {
      transactions: new InMemoryTransactionRepository(),
      categories: new InMemoryCategoryRepository(),
      budgets: new InMemoryBudgetRepository(),
      vendorCache: new InMemoryVendorCacheRepository(),
    };
  }

  /**
   * Create production Appwrite-backed repositories.
   * Will be implemented in FEAT-002 (Database Setup).
   */
  static create(_databases: unknown): Repositories {
    // TODO: Implement with Appwrite SDK in FEAT-002
    throw new Error('Appwrite repositories not yet implemented. See FEAT-002.');
  }
}
