import { beforeEach, describe, it, expect } from 'vitest';

import fixtures from '../../fixtures/budgets.json';

import type { BudgetCreate } from '@/types/budget';

import { InMemoryBudgetRepository } from '@/lib/repositories/in-memory/budget.repository';

let repo: InMemoryBudgetRepository;

const seedData: BudgetCreate[] = fixtures.map((b) => ({
  userId: b.user_id,
  categoryId: b.category_id,
  amount: b.amount,
  year: b.year,
  month: b.month,
}));

beforeEach(async () => {
  repo = new InMemoryBudgetRepository();
  repo.reset();
  for (const b of seedData) {
    await repo.create(b);
  }
});

describe('InMemoryBudgetRepository', () => {
  describe('findByUserAndPeriod', () => {
    it('returns budgets for Feb 2026', async () => {
      const budgets = await repo.findByUserAndPeriod('test-user-001', 2026, 2);
      expect(budgets).toHaveLength(8);
    });

    it('returns empty for period with no budgets', async () => {
      const budgets = await repo.findByUserAndPeriod('test-user-001', 2026, 3);
      expect(budgets).toHaveLength(0);
    });
  });

  describe('findByUserCategoryPeriod', () => {
    it('finds specific budget', async () => {
      const budget = await repo.findByUserCategoryPeriod('test-user-001', 'cat-food', 2026, 2);
      expect(budget).not.toBeNull();
      expect(budget!.amount).toBe(400);
    });

    it('returns null for non-existent combination', async () => {
      const budget = await repo.findByUserCategoryPeriod('test-user-001', 'cat-food', 2026, 3);
      expect(budget).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a new budget', async () => {
      const created = await repo.create({
        userId: 'test-user-001',
        categoryId: 'cat-food',
        amount: 450,
        year: 2026,
        month: 3,
      });
      expect(created.id).toBeTruthy();
      expect(created.amount).toBe(450);
      expect(created.year).toBe(2026);
      expect(created.month).toBe(3);
    });
  });

  describe('update', () => {
    it('updates a budget amount', async () => {
      const budgets = await repo.findByUserAndPeriod('test-user-001', 2026, 2);
      const first = budgets[0];

      const updated = await repo.update(first.id, { amount: 500 });
      expect(updated.amount).toBe(500);
    });

    it('throws for non-existent budget', async () => {
      await expect(repo.update('nonexistent', { amount: 100 })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('removes a budget', async () => {
      const budgets = await repo.findByUserAndPeriod('test-user-001', 2026, 2);
      const first = budgets[0];

      await repo.delete(first.id);
      const found = await repo.findById(first.id);
      expect(found).toBeNull();
    });
  });

  describe('deleteByCategoryId', () => {
    it('removes all budgets for a category', async () => {
      await repo.deleteByCategoryId('cat-food');
      const budget = await repo.findByUserCategoryPeriod('test-user-001', 'cat-food', 2026, 2);
      expect(budget).toBeNull();
    });
  });
});
