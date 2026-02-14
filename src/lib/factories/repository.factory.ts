/**
 * Repository factory — creates repository instances.
 *
 * Production: Appwrite-backed repositories (TablesDB).
 * Testing: In-memory repositories.
 */

import type { TablesDB } from 'node-appwrite';
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
   */
  static async createAppwrite(tablesDb: TablesDB): Promise<Repositories> {
    const [
      { AppwriteTransactionRepository },
      { AppwriteCategoryRepository },
      { AppwriteBudgetRepository },
      { AppwriteVendorCacheRepository },
    ] = await Promise.all([
      import('@/lib/repositories/appwrite/transaction.repository'),
      import('@/lib/repositories/appwrite/category.repository'),
      import('@/lib/repositories/appwrite/budget.repository'),
      import('@/lib/repositories/appwrite/vendor-cache.repository'),
    ]);

    return {
      transactions: new AppwriteTransactionRepository(tablesDb),
      categories: new AppwriteCategoryRepository(tablesDb),
      budgets: new AppwriteBudgetRepository(tablesDb),
      vendorCache: new AppwriteVendorCacheRepository(tablesDb),
    };
  }
}
