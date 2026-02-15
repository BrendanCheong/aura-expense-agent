import { beforeEach, describe, it, expect } from 'vitest';

import fixtures from '../../fixtures/transactions.json';

import type { TransactionCreate } from '@/types/transaction';

import { Confidence, TransactionSource } from '@/lib/enums';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';

let repo: InMemoryTransactionRepository;

const seedData: TransactionCreate[] = fixtures.map((tx) => ({
  userId: tx.user_id,
  categoryId: tx.category_id,
  amount: tx.amount,
  vendor: tx.vendor,
  description: tx.description,
  transactionDate: tx.transaction_date,
  resendEmailId: tx.resend_email_id,
  rawEmailSubject: tx.raw_email_subject,
  confidence: tx.confidence as Confidence,
  source: tx.source as TransactionSource,
}));

beforeEach(async () => {
  repo = new InMemoryTransactionRepository();
  repo.reset();
  for (const tx of seedData) {
    await repo.create(tx);
  }
});

describe('InMemoryTransactionRepository', () => {
  describe('findById', () => {
    it('returns a transaction when it exists', async () => {
      const allForUser = await repo.findByUserId('test-user-001', { page: 1, limit: 100 });
      const first = allForUser.data[0];
      const found = await repo.findById(first.id);
      expect(found).not.toBeNull();
      expect(found!.vendor).toBeTruthy();
    });

    it('returns null for non-existent id', async () => {
      const result = await repo.findById('tx-999');
      expect(result).toBeNull();
    });
  });

  describe('findByResendEmailId', () => {
    it('finds transaction by resend email ID', async () => {
      const result = await repo.findByResendEmailId('resend-001');
      expect(result).not.toBeNull();
      expect(result!.vendor).toBe('GRAB *GRABFOOD');
    });

    it('returns null for non-existent resend email ID', async () => {
      const result = await repo.findByResendEmailId('resend-999');
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns paginated results (page 1)', async () => {
      const result = await repo.findByUserId('test-user-001', { page: 1, limit: 5 });
      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(16);
      expect(result.hasMore).toBe(true);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
    });

    it('returns last page correctly', async () => {
      const result = await repo.findByUserId('test-user-001', { page: 4, limit: 5 });
      expect(result.data.length).toBeLessThanOrEqual(5);
      expect(result.hasMore).toBe(false);
    });

    it('filters by category', async () => {
      const result = await repo.findByUserId('test-user-001', {
        page: 1,
        limit: 100,
        categoryId: 'cat-food',
      });
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((tx) => expect(tx.categoryId).toBe('cat-food'));
    });

    it('filters by date range', async () => {
      const result = await repo.findByUserId('test-user-001', {
        page: 1,
        limit: 100,
        startDate: '2026-02-05',
        endDate: '2026-02-10',
      });
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((tx) => {
        expect(tx.transactionDate >= '2026-02-05').toBe(true);
        expect(tx.transactionDate < '2026-02-10').toBe(true);
      });
    });

    it('filters by source', async () => {
      const result = await repo.findByUserId('test-user-001', {
        page: 1,
        limit: 100,
        source: TransactionSource.EMAIL,
      });
      result.data.forEach((tx) => expect(tx.source).toBe(TransactionSource.EMAIL));
      expect(result.data.length).toBe(15);
    });

    it('returns empty for wrong user', async () => {
      const result = await repo.findByUserId('test-user-002', { page: 1, limit: 100 });
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findByUserAndDateRange', () => {
    it('returns transactions in February 2026', async () => {
      const result = await repo.findByUserAndDateRange('test-user-001', '2026-02-01', '2026-03-01');
      expect(result.length).toBe(16);
    });
  });

  describe('create', () => {
    it('creates a new transaction with generated ID', async () => {
      const created = await repo.create({
        userId: 'test-user-001',
        categoryId: 'cat-food',
        amount: 15.0,
        vendor: 'NEW VENDOR',
        description: 'Test',
        transactionDate: '2026-02-20T12:00:00+08:00',
        resendEmailId: 'resend-new',
        rawEmailSubject: 'Test Subject',
        confidence: Confidence.HIGH,
        source: TransactionSource.MANUAL,
      });

      expect(created.id).toBeTruthy();
      expect(created.vendor).toBe('NEW VENDOR');
      expect(created.amount).toBe(15.0);
      expect(created.createdAt).toBeTruthy();
    });
  });

  describe('update', () => {
    it('updates a transaction category', async () => {
      const allForUser = await repo.findByUserId('test-user-001', { page: 1, limit: 1 });
      const first = allForUser.data[0];

      const updated = await repo.update(first.id, { categoryId: 'cat-other' });
      expect(updated.categoryId).toBe('cat-other');
      expect(updated.updatedAt).toBeTruthy();
    });

    it('throws for non-existent transaction', async () => {
      await expect(repo.update('nonexistent', { amount: 10 })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes a transaction', async () => {
      const allForUser = await repo.findByUserId('test-user-001', { page: 1, limit: 1 });
      const first = allForUser.data[0];

      await repo.delete(first.id);
      const found = await repo.findById(first.id);
      expect(found).toBeNull();
    });
  });

  describe('sumByUserCategoryDateRange', () => {
    it('returns per-category spending summaries', async () => {
      const summaries = await repo.sumByUserCategoryDateRange(
        'test-user-001',
        '2026-02-01',
        '2026-03-01'
      );
      expect(summaries.length).toBeGreaterThan(0);
      const foodSummary = summaries.find((s) => s.categoryId === 'cat-food');
      expect(foodSummary).toBeDefined();
      expect(foodSummary!.totalSpent).toBeGreaterThan(0);
    });
  });
});
