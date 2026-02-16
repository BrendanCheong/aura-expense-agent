/**
 * Unit tests — TransactionService
 *
 * 18 tests per test plan (03-services.test-plan.md)
 * Pattern: Prepare → Act → Assert
 * Seeding: Shared seed helper from __tests__/helpers/seed.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  seedTransactions,
  seedVendorCache,
  transactionsFixture,
} from '../../helpers/seed';

import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import { InMemoryVendorCacheRepository } from '@/lib/repositories/in-memory/vendor-cache.repository';
import { TransactionService, NotFoundError, ValidationError } from '@/lib/services/transaction.service';

const USER_ID = 'test-user-001';

describe('TransactionService', () => {
  let service: TransactionService;
  let transactionRepo: InMemoryTransactionRepository;
  let vendorCacheRepo: InMemoryVendorCacheRepository;

  beforeEach(() => {
    // ---- Prepare ----
    transactionRepo = new InMemoryTransactionRepository();
    vendorCacheRepo = new InMemoryVendorCacheRepository();
    service = new TransactionService(transactionRepo, vendorCacheRepo);

    // Seed fixture data
    seedTransactions(transactionRepo);
    seedVendorCache(vendorCacheRepo);
  });

  // =========================================================================
  // Test #1: listTransactions — returns paginated results
  // =========================================================================
  it('should return paginated results (5 per page, total = 16)', async () => {
    // ---- Act ----
    const result = await service.listTransactions(USER_ID, {
      page: 1,
      limit: 5,
    });

    // ---- Assert ----
    expect(result.data).toHaveLength(5);
    expect(result.total).toBe(16);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(5);
    expect(result.hasMore).toBe(true);
  });

  // =========================================================================
  // Test #2: listTransactions — filters by category
  // =========================================================================
  it('should filter by categoryId', async () => {
    // ---- Act ----
    const result = await service.listTransactions(USER_ID, {
      page: 1,
      limit: 100,
      categoryId: 'cat-food',
    });

    // ---- Assert ----
    const expectedCount = transactionsFixture.filter(
      (tx) => tx.user_id === USER_ID && tx.category_id === 'cat-food'
    ).length;
    expect(result.data).toHaveLength(expectedCount);
    expect(result.data.every((tx) => tx.categoryId === 'cat-food')).toBe(true);
  });

  // =========================================================================
  // Test #3: listTransactions — filters by date range
  // =========================================================================
  it('should filter by date range (Feb 5–10)', async () => {
    // ---- Act ----
    const result = await service.listTransactions(USER_ID, {
      page: 1,
      limit: 100,
      startDate: '2026-02-05T00:00:00+08:00',
      endDate: '2026-02-11T00:00:00+08:00',
    });

    // ---- Assert ----
    for (const tx of result.data) {
      expect(tx.transactionDate >= '2026-02-05T00:00:00+08:00').toBe(true);
      expect(tx.transactionDate < '2026-02-11T00:00:00+08:00').toBe(true);
    }
    expect(result.data.length).toBeGreaterThan(0);
  });

  // =========================================================================
  // Test #4: listTransactions — isolates by userId
  // =========================================================================
  it('should isolate data by userId (user-002 sees no user-001 data)', async () => {
    // ---- Act ----
    const result = await service.listTransactions('test-user-002', {
      page: 1,
      limit: 100,
    });

    // ---- Assert ----
    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  // =========================================================================
  // Test #5: getTransaction — existing, owned
  // =========================================================================
  it('should return transaction for valid id and owner', async () => {
    // ---- Act ----
    const tx = await service.getTransaction(USER_ID, 'tx-001');

    // ---- Assert ----
    expect(tx).toBeDefined();
    expect(tx.id).toBe('tx-001');
    expect(tx.userId).toBe(USER_ID);
    expect(tx.vendor).toBe('GRAB *GRABFOOD');
  });

  // =========================================================================
  // Test #6: getTransaction — not found
  // =========================================================================
  it('should throw NotFoundError for non-existent transaction', async () => {
    // ---- Act + Assert ----
    await expect(service.getTransaction(USER_ID, 'tx-999')).rejects.toThrow(NotFoundError);
    await expect(service.getTransaction(USER_ID, 'tx-999')).rejects.toThrow(
      'Transaction tx-999 not found'
    );
  });

  // =========================================================================
  // Test #7: getTransaction — wrong owner
  // =========================================================================
  it('should throw NotFoundError when userId does not match', async () => {
    // ---- Act + Assert ----
    // tx-001 belongs to test-user-001, not test-user-002
    await expect(service.getTransaction('test-user-002', 'tx-001')).rejects.toThrow(
      NotFoundError
    );
  });

  // =========================================================================
  // Test #8: createManualTransaction — valid
  // =========================================================================
  it('should create manual transaction with source=manual and confidence=high', async () => {
    // ---- Act ----
    const tx = await service.createManualTransaction(USER_ID, {
      amount: 25.5,
      vendor: 'Hawker Centre',
      categoryId: 'cat-food',
      transactionDate: '2026-02-14T12:00:00+08:00',
      description: 'Chicken rice',
    });

    // ---- Assert ----
    expect(tx.source).toBe('manual');
    expect(tx.confidence).toBe('high');
    expect(tx.amount).toBe(25.5);
    expect(tx.vendor).toBe('Hawker Centre');
    expect(tx.categoryId).toBe('cat-food');
    expect(tx.description).toBe('Chicken rice');
    expect(tx.userId).toBe(USER_ID);
    expect(tx.id).toBeDefined();
  });

  // =========================================================================
  // Test #9: createManualTransaction — zero amount
  // =========================================================================
  it('should throw ValidationError for zero amount', async () => {
    // ---- Act + Assert ----
    await expect(
      service.createManualTransaction(USER_ID, {
        amount: 0,
        vendor: 'Test',
        categoryId: 'cat-food',
        transactionDate: '2026-02-14T12:00:00+08:00',
      })
    ).rejects.toThrow(ValidationError);
  });

  // =========================================================================
  // Test #10: createManualTransaction — negative amount
  // =========================================================================
  it('should throw ValidationError for negative amount', async () => {
    // ---- Act + Assert ----
    await expect(
      service.createManualTransaction(USER_ID, {
        amount: -10,
        vendor: 'Test',
        categoryId: 'cat-food',
        transactionDate: '2026-02-14T12:00:00+08:00',
      })
    ).rejects.toThrow(ValidationError);
  });

  // =========================================================================
  // Test #11: createManualTransaction — updates vendor cache
  // =========================================================================
  it('should create vendor cache entry for new vendor', async () => {
    // ---- Act ----
    await service.createManualTransaction(USER_ID, {
      amount: 30.0,
      vendor: 'New Restaurant',
      categoryId: 'cat-food',
      transactionDate: '2026-02-14T12:00:00+08:00',
    });

    // ---- Assert ----
    const cached = await vendorCacheRepo.findByUserAndVendor(USER_ID, 'NEW RESTAURANT');
    expect(cached).not.toBeNull();
    expect(cached!.categoryId).toBe('cat-food');
  });

  // =========================================================================
  // Test #12: createManualTransaction — existing vendor in cache
  // =========================================================================
  it('should not duplicate vendor cache for known vendor', async () => {
    // ---- Prepare ----
    // GRAB *GRABFOOD is in vendor cache fixture (vc-001)
    const cachedBefore = await vendorCacheRepo.findByUserAndVendor(USER_ID, 'GRAB *GRABFOOD');
    expect(cachedBefore).not.toBeNull();

    // ---- Act ----
    await service.createManualTransaction(USER_ID, {
      amount: 15.0,
      vendor: 'GRAB *GRABFOOD',
      categoryId: 'cat-food',
      transactionDate: '2026-02-14T12:00:00+08:00',
    });

    // ---- Assert ----
    // Only one entry should exist (not duplicated)
    const allEntries = await vendorCacheRepo.findByUserId(USER_ID);
    const grabFoodEntries = allEntries.filter((e) => e.vendorName === 'GRAB *GRABFOOD');
    expect(grabFoodEntries).toHaveLength(1);
  });

  // =========================================================================
  // Test #13: updateTransaction — change category
  // =========================================================================
  it('should update category and vendor cache when re-categorizing', async () => {
    // ---- Act ----
    const updated = await service.updateTransaction(USER_ID, 'tx-001', {
      categoryId: 'cat-shopping',
    });

    // ---- Assert ----
    expect(updated.categoryId).toBe('cat-shopping');

    // Vendor cache for GRAB *GRABFOOD should now point to cat-shopping
    const cached = await vendorCacheRepo.findByUserAndVendor(USER_ID, 'GRAB *GRABFOOD');
    expect(cached).not.toBeNull();
    expect(cached!.categoryId).toBe('cat-shopping');
  });

  // =========================================================================
  // Test #14: updateTransaction — ownership check
  // =========================================================================
  it('should throw NotFoundError when updating another user\'s transaction', async () => {
    // ---- Act + Assert ----
    await expect(
      service.updateTransaction('test-user-002', 'tx-001', { categoryId: 'cat-shopping' })
    ).rejects.toThrow(NotFoundError);
  });

  // =========================================================================
  // Test #15: deleteTransaction — existing
  // =========================================================================
  it('should delete an existing transaction', async () => {
    // ---- Act ----
    await service.deleteTransaction(USER_ID, 'tx-001');

    // ---- Assert ----
    const deleted = await transactionRepo.findById('tx-001');
    expect(deleted).toBeNull();
  });

  // =========================================================================
  // Test #16: deleteTransaction — ownership check
  // =========================================================================
  it('should throw NotFoundError when deleting another user\'s transaction', async () => {
    // ---- Act + Assert ----
    await expect(service.deleteTransaction('test-user-002', 'tx-001')).rejects.toThrow(
      NotFoundError
    );
  });

  // =========================================================================
  // Test #17: isDuplicate — existing resend_email_id
  // =========================================================================
  it('should return true for existing resend_email_id', async () => {
    // ---- Act ----
    // tx-001 has resend_email_id: "resend-001"
    const result = await service.isDuplicate('resend-001');

    // ---- Assert ----
    expect(result).toBe(true);
  });

  // =========================================================================
  // Test #18: isDuplicate — new resend_email_id
  // =========================================================================
  it('should return false for new resend_email_id', async () => {
    // ---- Act ----
    const result = await service.isDuplicate('resend-new');

    // ---- Assert ----
    expect(result).toBe(false);
  });
});
