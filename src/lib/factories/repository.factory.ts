/**
 * Repository factory — creates repository instances.
 *
 * Production: Appwrite-backed repositories (TablesDB).
 * Testing: In-memory repositories.
 */

import type {
  ITransactionRepository,
  ICategoryRepository,
  IBudgetRepository,
  IVendorCacheRepository,
  IUserRepository,
} from '@/lib/repositories/interfaces';
import type { TablesDB } from 'node-appwrite';

export interface Repositories {
  transactions: ITransactionRepository;
  categories: ICategoryRepository;
  budgets: IBudgetRepository;
  vendorCache: IVendorCacheRepository;
  users: IUserRepository;
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
      { InMemoryUserRepository },
    ] = await Promise.all([
      import('@/lib/repositories/in-memory/transaction.repository'),
      import('@/lib/repositories/in-memory/category.repository'),
      import('@/lib/repositories/in-memory/budget.repository'),
      import('@/lib/repositories/in-memory/vendor-cache.repository'),
      import('@/lib/repositories/in-memory/user.repository'),
    ]);

    return {
      transactions: new InMemoryTransactionRepository(),
      categories: new InMemoryCategoryRepository(),
      budgets: new InMemoryBudgetRepository(),
      vendorCache: new InMemoryVendorCacheRepository(),
      users: new InMemoryUserRepository(),
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
      { AppwriteUserRepository },
    ] = await Promise.all([
      import('@/lib/repositories/appwrite/transaction.repository'),
      import('@/lib/repositories/appwrite/category.repository'),
      import('@/lib/repositories/appwrite/budget.repository'),
      import('@/lib/repositories/appwrite/vendor-cache.repository'),
      import('@/lib/repositories/appwrite/user.repository'),
    ]);

    return {
      transactions: new AppwriteTransactionRepository(tablesDb),
      categories: new AppwriteCategoryRepository(tablesDb),
      budgets: new AppwriteBudgetRepository(tablesDb),
      vendorCache: new AppwriteVendorCacheRepository(tablesDb),
      users: new AppwriteUserRepository(tablesDb),
    };
  }
}
