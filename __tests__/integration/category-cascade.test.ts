/**
 * Integration tests — Category cascade operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  seedCategories,
  seedTransactions,
  seedVendorCache,
  seedBudgets,
  transactionsFixture,
} from '../helpers/seed';

import { InMemoryBudgetRepository } from '@/lib/repositories/in-memory/budget.repository';
import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import { InMemoryVendorCacheRepository } from '@/lib/repositories/in-memory/vendor-cache.repository';
import { BudgetService } from '@/lib/services/budget.service';
import { CategoryService } from '@/lib/services/category.service';
import { TransactionService } from '@/lib/services/transaction.service';



const USER_ID = 'test-user-001';

describe('Integration: Category Cascade', () => {
  let categoryService: CategoryService;
  let transactionService: TransactionService;
  let budgetService: BudgetService;
  let categoryRepo: InMemoryCategoryRepository;
  let vendorCacheRepo: InMemoryVendorCacheRepository;
  let budgetRepo: InMemoryBudgetRepository;
  let transactionRepo: InMemoryTransactionRepository;

  beforeEach(() => {
    categoryRepo = new InMemoryCategoryRepository();
    vendorCacheRepo = new InMemoryVendorCacheRepository();
    budgetRepo = new InMemoryBudgetRepository();
    transactionRepo = new InMemoryTransactionRepository();

    categoryService = new CategoryService(
      categoryRepo,
      vendorCacheRepo,
      budgetRepo,
      transactionRepo
    );
    transactionService = new TransactionService(transactionRepo, vendorCacheRepo);
    budgetService = new BudgetService(budgetRepo, transactionRepo);

    // Seed fixture data via shared helpers
    seedCategories(categoryRepo);
    seedVendorCache(vendorCacheRepo);
    seedBudgets(budgetRepo);
    seedTransactions(transactionRepo);
  });

  it('Test #16: Delete category → transactions move to Other', async () => {
    // Transport has 2 transactions: tx-002 (MRT TOP-UP), tx-006 (GRAB *RIDE)
    await categoryService.deleteCategory(USER_ID, 'cat-transport');

    // Verify transactions moved to "Other"
    const tx002 = await transactionRepo.findById('tx-002');
    expect(tx002!.categoryId).toBe('cat-other');
    expect(tx002!.vendor).toBe('MRT TOP-UP'); // vendor unchanged

    const tx006 = await transactionRepo.findById('tx-006');
    expect(tx006!.categoryId).toBe('cat-other');

    // Verify transactions are still listed
    const result = await transactionService.listTransactions(USER_ID, {
      page: 1,
      limit: 100,
    });
    expect(result.total).toBe(16); // no transactions lost
  });

  it('Test #17: Delete category → vendor cache cleaned', async () => {
    // Transport has 1 vendor cache entry: vc-002 (GRAB *RIDE)
    await categoryService.deleteCategory(USER_ID, 'cat-transport');

    const vendorEntries = await vendorCacheRepo.findByUserId(USER_ID);
    const transportVendors = vendorEntries.filter((v) => v.categoryId === 'cat-transport');
    expect(transportVendors).toHaveLength(0);

    // Other vendor cache entries should remain
    expect(vendorEntries.length).toBe(6); // 7 original - 1 deleted
  });

  it('Test #18: Delete category → budgets removed', async () => {
    // Transport has 1 budget: budget-002
    await categoryService.deleteCategory(USER_ID, 'cat-transport');

    const budgets = await budgetService.listBudgets(USER_ID, 2026, 2);
    const transportBudgets = budgets.filter((b) => b.categoryId === 'cat-transport');
    expect(transportBudgets).toHaveLength(0);

    // Other budgets remain
    expect(budgets.length).toBe(7); // 8 original - 1 deleted
  });

  it('Test #19: Cannot delete "Other" category', async () => {
    await expect(categoryService.deleteCategory(USER_ID, 'cat-other')).rejects.toThrow(
      'Cannot delete'
    );

    // Verify category still exists
    const other = await categoryRepo.findById('cat-other');
    expect(other).not.toBeNull();
    expect(other!.name).toBe('Other');
  });

  it('Full cascade: delete category with transactions, vendor cache, and budgets', async () => {
    // Food has: 4 transactions (tx-001, tx-004, tx-009, tx-014, tx-016),
    //           1 vendor cache entry (vc-001 GRAB *GRABFOOD),
    //           1 budget (budget-001)
    const foodTxBefore = transactionsFixture.filter((tx) => tx.category_id === 'cat-food');

    await categoryService.deleteCategory(USER_ID, 'cat-food');

    // Category deleted
    expect(await categoryRepo.findById('cat-food')).toBeNull();

    // All food transactions moved to Other
    for (const txFixture of foodTxBefore) {
      const tx = await transactionRepo.findById(txFixture.id);
      expect(tx!.categoryId).toBe('cat-other');
    }

    // Vendor cache cleaned
    const allVendors = await vendorCacheRepo.findByUserId(USER_ID);
    expect(allVendors.filter((v) => v.categoryId === 'cat-food')).toHaveLength(0);

    // Budget removed
    const budgets = await budgetService.listBudgets(USER_ID, 2026, 2);
    expect(budgets.filter((b) => b.categoryId === 'cat-food')).toHaveLength(0);
  });

  it('Re-categorize transaction → vendor cache updated', async () => {
    // tx-001 is GRAB *GRABFOOD (cat-food). Re-categorize to cat-shopping.
    const updated = await transactionService.updateTransaction(USER_ID, 'tx-001', {
      categoryId: 'cat-shopping',
    });

    expect(updated.categoryId).toBe('cat-shopping');

    // Vendor cache for GRAB *GRABFOOD should now point to cat-shopping
    const cached = await vendorCacheRepo.findByUserAndVendor(USER_ID, 'GRAB *GRABFOOD');
    expect(cached).not.toBeNull();
    expect(cached!.categoryId).toBe('cat-shopping');
  });

  it('Create manual transaction → vendor cache entry created', async () => {
    const tx = await transactionService.createManualTransaction(USER_ID, {
      amount: 25.5,
      vendor: 'Hawker Centre',
      categoryId: 'cat-food',
      transactionDate: '2026-02-14T12:00:00+08:00',
      description: 'Chicken rice',
    });

    expect(tx.source).toBe('manual');
    expect(tx.confidence).toBe('high');

    // Vendor cache should have entry for HAWKER CENTRE
    const cached = await vendorCacheRepo.findByUserAndVendor(USER_ID, 'HAWKER CENTRE');
    expect(cached).not.toBeNull();
    expect(cached!.categoryId).toBe('cat-food');
  });
});
