import { describe, it, expect, beforeEach } from 'vitest';
import { CategoryService } from '@/lib/services/category.service';
import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import { InMemoryVendorCacheRepository } from '@/lib/repositories/in-memory/vendor-cache.repository';
import { InMemoryBudgetRepository } from '@/lib/repositories/in-memory/budget.repository';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import type { Category } from '@/types/category';
import type { VendorCacheEntry } from '@/types/vendor-cache';
import type { Budget } from '@/types/budget';
import type { Transaction } from '@/types/transaction';

import categoriesFixture from '../../fixtures/categories.json';
import vendorCacheFixture from '../../fixtures/vendor-cache.json';
import budgetsFixture from '../../fixtures/budgets.json';
import transactionsFixture from '../../fixtures/transactions.json';

const USER_ID = 'test-user-001';

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepo: InMemoryCategoryRepository;
  let vendorCacheRepo: InMemoryVendorCacheRepository;
  let budgetRepo: InMemoryBudgetRepository;
  let transactionRepo: InMemoryTransactionRepository;

  beforeEach(() => {
    categoryRepo = new InMemoryCategoryRepository();
    vendorCacheRepo = new InMemoryVendorCacheRepository();
    budgetRepo = new InMemoryBudgetRepository();
    transactionRepo = new InMemoryTransactionRepository();
    service = new CategoryService(categoryRepo, vendorCacheRepo, budgetRepo, transactionRepo);

    // Seed fixture data
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
  });

  describe('listCategories', () => {
    it('should return all categories for user sorted by sort_order', async () => {
      const categories = await service.listCategories(USER_ID);
      expect(categories).toHaveLength(8);
      // Verify sort order
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].sortOrder).toBeGreaterThanOrEqual(categories[i - 1].sortOrder);
      }
    });

    it('should return empty array for user with no categories', async () => {
      const categories = await service.listCategories('non-existent-user');
      expect(categories).toHaveLength(0);
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const category = await service.createCategory(USER_ID, {
        name: 'Subscriptions',
        description: 'Monthly subscriptions and recurring payments',
        icon: '📱',
        color: '#10b981',
        isDefault: false,
        sortOrder: 9,
      });

      expect(category.name).toBe('Subscriptions');
      expect(category.description).toBe('Monthly subscriptions and recurring payments');
      expect(category.userId).toBe(USER_ID);
      expect(category.icon).toBe('📱');
      expect(category.color).toBe('#10b981');
    });

    it('should throw when creating category with duplicate name', async () => {
      await expect(
        service.createCategory(USER_ID, {
          name: 'Food & Beverage',
          description: 'Duplicate',
          isDefault: false,
          sortOrder: 9,
        }),
      ).rejects.toThrow('already exists');
    });
  });

  describe('updateCategory', () => {
    it('should update category description', async () => {
      const updated = await service.updateCategory(USER_ID, 'cat-food', {
        description: 'Updated food description',
      });

      expect(updated.description).toBe('Updated food description');
      expect(updated.name).toBe('Food & Beverage');
    });

    it('should throw when updating non-existent category', async () => {
      await expect(
        service.updateCategory(USER_ID, 'cat-nonexistent', { name: 'Test' }),
      ).rejects.toThrow('not found');
    });

    it('should throw when updating category owned by another user', async () => {
      await expect(
        service.updateCategory('other-user', 'cat-food', { name: 'Test' }),
      ).rejects.toThrow('not found');
    });
  });

  describe('deleteCategory', () => {
    it('should cascade delete vendor cache and budgets, and move transactions to Other', async () => {
      // cat-transport has: 2 transactions (tx-002, tx-006), 1 vendor cache entry (vc-002), 1 budget (budget-002)
      await service.deleteCategory(USER_ID, 'cat-transport');

      // Category should be deleted
      const deleted = await categoryRepo.findById('cat-transport');
      expect(deleted).toBeNull();

      // Vendor cache entries for this category should be deleted
      const vendorEntries = await vendorCacheRepo.findByUserId(USER_ID);
      const transportVendors = vendorEntries.filter((v: VendorCacheEntry) => v.categoryId === 'cat-transport');
      expect(transportVendors).toHaveLength(0);

      // Budgets for this category should be deleted
      const budgets = await budgetRepo.findByUserAndPeriod(USER_ID, 2026, 2);
      const transportBudgets = budgets.filter((b: Budget) => b.categoryId === 'cat-transport');
      expect(transportBudgets).toHaveLength(0);

      // Transactions should be moved to "Other"
      const tx002 = await transactionRepo.findById('tx-002');
      expect(tx002!.categoryId).toBe('cat-other');
      const tx006 = await transactionRepo.findById('tx-006');
      expect(tx006!.categoryId).toBe('cat-other');
    });

    it('should throw when trying to delete "Other" system category', async () => {
      await expect(
        service.deleteCategory(USER_ID, 'cat-other'),
      ).rejects.toThrow();
    });

    it('should throw when deleting a category not owned by user', async () => {
      await expect(
        service.deleteCategory('other-user', 'cat-food'),
      ).rejects.toThrow('not found');
    });

    it('should delete category with no transactions', async () => {
      // cat-invest has no transactions in fixtures
      await service.deleteCategory(USER_ID, 'cat-invest');

      const deleted = await categoryRepo.findById('cat-invest');
      expect(deleted).toBeNull();
    });
  });

  describe('seedDefaults', () => {
    it('should create 8 default categories for a new user', async () => {
      const newUserId = 'new-user-123';
      const categories = await service.seedDefaults(newUserId);

      expect(categories).toHaveLength(8);

      const names = categories.map((c: Category) => c.name);
      expect(names).toContain('Food & Beverage');
      expect(names).toContain('Transportation');
      expect(names).toContain('Shopping');
      expect(names).toContain('Entertainment');
      expect(names).toContain('Bills & Utilities');
      expect(names).toContain('Travel');
      expect(names).toContain('Investment');
      expect(names).toContain('Other');
    });
  });
});
