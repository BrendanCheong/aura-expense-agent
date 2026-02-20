/**
 * Unit tests — BudgetService
 *
 * Tests per test plan (03-services.test-plan.md #28-#35)
 * Pattern: Prepare → Act → Assert
 * Seeding: Shared seed helper from __tests__/helpers/seed.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  seedBudgets,
  seedTransactions,
  budgetsFixture,
} from '../../helpers/seed';

import { InMemoryBudgetRepository } from '@/lib/repositories/in-memory/budget.repository';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import { BudgetService } from '@/lib/services/budget.service';
import { BudgetNotFoundError, BudgetAlreadyExistsError } from '@/lib/errors';

const USER_ID = 'test-user-001';

describe('BudgetService', () => {
  let service: BudgetService;
  let budgetRepo: InMemoryBudgetRepository;
  let transactionRepo: InMemoryTransactionRepository;

  beforeEach(() => {
    // ---- Prepare ----
    budgetRepo = new InMemoryBudgetRepository();
    transactionRepo = new InMemoryTransactionRepository();
    service = new BudgetService(budgetRepo, transactionRepo);

    seedBudgets(budgetRepo);
    seedTransactions(transactionRepo);
  });

  // =========================================================================
  // #28: getBudgetsWithSpending — Feb 2026 returns enriched budgets
  // =========================================================================
  describe('getBudgetsWithSpending', () => {
    it('should return enriched budgets for Feb 2026 with spending data', async () => {
      // ---- Act ----
      const result = await service.getBudgetsWithSpending(USER_ID, 2026, 2);

      // ---- Assert ----
      expect(result.budgets).toHaveLength(8);
      for (const budget of result.budgets) {
        expect(budget).toHaveProperty('id');
        expect(budget).toHaveProperty('categoryId');
        expect(budget).toHaveProperty('budgetAmount');
        expect(budget).toHaveProperty('spentAmount');
        expect(budget).toHaveProperty('remainingAmount');
        expect(budget).toHaveProperty('percentUsed');
        expect(budget).toHaveProperty('status');
        expect(['on_track', 'warning', 'over_budget']).toContain(budget.status);
      }
    });

    // =========================================================================
    // #29: getBudgetsWithSpending — no budgets set returns empty
    // =========================================================================
    it('should return empty for month with no budgets', async () => {
      // ---- Act ----
      const result = await service.getBudgetsWithSpending(USER_ID, 2026, 3);

      // ---- Assert ----
      expect(result.budgets).toHaveLength(0);
      expect(result.totalBudget).toBe(0);
      expect(result.totalSpent).toBe(0);
    });

    // =========================================================================
    // #34: calculateTotalBudget — all categories Feb 2026
    // =========================================================================
    it('should calculate correct total budget for Feb 2026', async () => {
      // ---- Prepare ----
      const expectedTotal = budgetsFixture.reduce((sum, b) => sum + b.amount, 0);

      // ---- Act ----
      const result = await service.getBudgetsWithSpending(USER_ID, 2026, 2);

      // ---- Assert ----
      expect(result.totalBudget).toBe(expectedTotal);
    });

    // =========================================================================
    // #35: getBudgetUtilization — per-category computation
    // =========================================================================
    it('should compute correct utilization per category', async () => {
      // ---- Act ----
      const result = await service.getBudgetsWithSpending(USER_ID, 2026, 2);

      // ---- Assert ----
      const foodBudget = result.budgets.find((b) => b.categoryId === 'cat-food');
      expect(foodBudget).toBeDefined();
      expect(foodBudget!.budgetAmount).toBe(400);
      expect(foodBudget!.spentAmount).toBeGreaterThanOrEqual(0);
      expect(foodBudget!.remainingAmount).toBe(
        foodBudget!.budgetAmount - foodBudget!.spentAmount
      );
      expect(foodBudget!.percentUsed).toBeCloseTo(
        (foodBudget!.spentAmount / foodBudget!.budgetAmount) * 100,
        1
      );
    });

    it('should mark budget as on_track when < 80% spent', async () => {
      // ---- Act ----
      const result = await service.getBudgetsWithSpending(USER_ID, 2026, 2);

      // ---- Assert — find a budget with low utilization ----
      const otherBudget = result.budgets.find((b) => b.categoryId === 'cat-other');
      expect(otherBudget).toBeDefined();
      // Other has $50 budget and minimal spending
      if (otherBudget!.percentUsed < 80) {
        expect(otherBudget!.status).toBe('on_track');
      }
    });
  });

  // =========================================================================
  // #30: createBudget — new budget
  // =========================================================================
  describe('createBudget', () => {
    it('should create a new budget for March 2026', async () => {
      // ---- Act ----
      const created = await service.createBudget(USER_ID, {
        categoryId: 'cat-food',
        amount: 450,
        year: 2026,
        month: 3,
      });

      // ---- Assert ----
      expect(created.id).toBeTruthy();
      expect(created.amount).toBe(450);
      expect(created.categoryId).toBe('cat-food');
      expect(created.year).toBe(2026);
      expect(created.month).toBe(3);
    });

    // =========================================================================
    // #32: createBudget — duplicate throws
    // =========================================================================
    it('should throw BudgetAlreadyExistsError for duplicate', async () => {
      // ---- Act + Assert ----
      await expect(
        service.createBudget(USER_ID, {
          categoryId: 'cat-food',
          amount: 500,
          year: 2026,
          month: 2,
        })
      ).rejects.toThrow(BudgetAlreadyExistsError);
    });
  });

  // =========================================================================
  // #31: upsertBudget — update existing + create new
  // =========================================================================
  describe('upsertBudget', () => {
    it('should update existing budget when one exists', async () => {
      // ---- Act ----
      const result = await service.upsertBudget(USER_ID, {
        categoryId: 'cat-food',
        amount: 500,
        year: 2026,
        month: 2,
      });

      // ---- Assert ----
      expect(result.amount).toBe(500);
      expect(result.categoryId).toBe('cat-food');

      // Verify no duplicate — still only 8 budgets for Feb 2026
      const all = await budgetRepo.findByUserAndPeriod(USER_ID, 2026, 2);
      expect(all).toHaveLength(8);
    });

    it('should create new budget when none exists', async () => {
      // ---- Act ----
      const result = await service.upsertBudget(USER_ID, {
        categoryId: 'cat-food',
        amount: 300,
        year: 2026,
        month: 3,
      });

      // ---- Assert ----
      expect(result.id).toBeTruthy();
      expect(result.amount).toBe(300);
      expect(result.year).toBe(2026);
      expect(result.month).toBe(3);
    });
  });

  // =========================================================================
  // #33: deleteBudget — existing
  // =========================================================================
  describe('deleteBudget', () => {
    it('should delete an existing budget', async () => {
      // ---- Prepare ----
      const budgets = await budgetRepo.findByUserAndPeriod(USER_ID, 2026, 2);
      const targetId = budgets[0].id;

      // ---- Act ----
      await service.deleteBudget(USER_ID, targetId);

      // ---- Assert ----
      const found = await budgetRepo.findById(targetId);
      expect(found).toBeNull();
    });

    it('should throw BudgetNotFoundError for non-existent budget', async () => {
      // ---- Act + Assert ----
      await expect(service.deleteBudget(USER_ID, 'nonexistent')).rejects.toThrow(
        BudgetNotFoundError
      );
    });

    it('should throw BudgetNotFoundError when user does not own budget', async () => {
      // ---- Prepare ----
      const budgets = await budgetRepo.findByUserAndPeriod(USER_ID, 2026, 2);
      const targetId = budgets[0].id;

      // ---- Act + Assert ----
      await expect(service.deleteBudget('test-user-002', targetId)).rejects.toThrow(
        BudgetNotFoundError
      );
    });
  });
});
