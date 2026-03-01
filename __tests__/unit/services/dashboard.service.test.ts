/**
 * Unit tests — DashboardService.
 *
 * Tests getSummary() and getAlerts() with InMemory repositories
 * seeded from JSON fixtures.
 */

import { beforeEach, describe, it, expect } from 'vitest';

import {
  seedBudgets,
  seedCategories,
  seedTransactions,
  budgetsFixture,
} from '../../helpers/seed';

import { InMemoryBudgetRepository } from '@/lib/repositories/in-memory/budget.repository';
import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import { DashboardService } from '@/lib/services/dashboard.service';
import { Confidence, TransactionSource } from '@/lib/enums';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let service: DashboardService;
let transactionRepo: InMemoryTransactionRepository;
let budgetRepo: InMemoryBudgetRepository;
let categoryRepo: InMemoryCategoryRepository;

beforeEach(() => {
  transactionRepo = new InMemoryTransactionRepository();
  budgetRepo = new InMemoryBudgetRepository();
  categoryRepo = new InMemoryCategoryRepository();

  seedCategories(categoryRepo);
  seedTransactions(transactionRepo);
  seedBudgets(budgetRepo);

  service = new DashboardService(transactionRepo, budgetRepo, categoryRepo);
});

// =========================================================================
// getSummary
// =========================================================================
describe('DashboardService.getSummary', () => {
  it('#36 — should return complete dashboard data for Feb 2026', async () => {
    // ---- Act ----
    const result = await service.getSummary({
      userId: 'test-user-001',
      period: 'month',
      year: 2026,
      month: 2,
    });

    // ---- Assert ----
    expect(result.period).toBe('month');
    expect(result.year).toBe(2026);
    expect(result.month).toBe(2);

    // Summary totals
    expect(result.summary.totalSpent).toBeCloseTo(728.5, 1);
    expect(result.summary.totalBudget).toBe(2700);
    expect(result.summary.transactionCount).toBe(16);
    expect(result.summary.averageTransaction).toBeCloseTo(728.5 / 16, 1);

    // Category breakdown — should have categories with spending
    expect(result.byCategory.length).toBeGreaterThanOrEqual(7);

    // Recent transactions — max 10
    expect(result.recentTransactions.length).toBe(10);

    // Daily spending — should have entries
    expect(result.dailySpending.length).toBeGreaterThan(0);
  });

  it('#37 — should return correct category breakdown', async () => {
    // ---- Act ----
    const result = await service.getSummary({
      userId: 'test-user-001',
      period: 'month',
      year: 2026,
      month: 2,
    });

    // ---- Assert ----
    const food = result.byCategory.find((c) => c.categoryId === 'cat-food');
    expect(food).toBeDefined();
    expect(food!.categoryName).toBe('Food & Beverage');
    expect(food!.spent).toBeCloseTo(121.0, 1);
    expect(food!.budget).toBe(400);
    expect(food!.icon).toBe('🍔');
    expect(food!.color).toBe('#ef4444');
    // 5 food transactions
    expect(food!.transactionCount).toBe(5);
    // percentage of total spent: 121 / 728.5 ≈ 16.6%
    expect(food!.percentage).toBeCloseTo((121.0 / 728.5) * 100, 0);

    const shopping = result.byCategory.find((c) => c.categoryId === 'cat-shopping');
    expect(shopping).toBeDefined();
    expect(shopping!.spent).toBeCloseTo(135.89, 1);
    expect(shopping!.budget).toBe(300);
  });

  it('#38 — should return recent transactions sorted by date desc', async () => {
    // ---- Act ----
    const result = await service.getSummary({
      userId: 'test-user-001',
      period: 'month',
      year: 2026,
      month: 2,
    });

    // ---- Assert ----
    const txs = result.recentTransactions;
    expect(txs.length).toBe(10);

    // Verify sorted by date desc
    for (let i = 0; i < txs.length - 1; i++) {
      expect(txs[i].transactionDate >= txs[i + 1].transactionDate).toBe(true);
    }

    // Should have category names (not empty)
    for (const tx of txs) {
      expect(tx.categoryName.length).toBeGreaterThan(0);
      expect(tx.categoryIcon.length).toBeGreaterThan(0);
    }

    // First transaction should be the most recent (tx-015: Feb 16)
    expect(txs[0].transactionDate).toContain('2026-02-16');
  });

  it('#39 — should return empty data for month with no transactions', async () => {
    // ---- Act ----
    const result = await service.getSummary({
      userId: 'test-user-001',
      period: 'month',
      year: 2026,
      month: 3,
    });

    // ---- Assert ----
    expect(result.summary.totalSpent).toBe(0);
    expect(result.summary.totalBudget).toBe(0);
    expect(result.summary.transactionCount).toBe(0);
    expect(result.summary.averageTransaction).toBe(0);
    expect(result.byCategory).toEqual([]);
    expect(result.recentTransactions).toEqual([]);
    expect(result.dailySpending).toEqual([]);
  });

  it('should support week period', async () => {
    // ---- Prepare ----
    // Week 6 of 2026 = Feb 2-8 (Mon-Sun)
    // Transactions in that range: tx-004 (Feb 2), tx-005 (Feb 3),
    // tx-006 (Feb 3), tx-007 (Feb 4), tx-009 (Feb 5), tx-010 (Feb 6),
    // tx-011 (Feb 7), tx-008 (Feb 8), tx-012 (Feb 8)

    // ---- Act ----
    const result = await service.getSummary({
      userId: 'test-user-001',
      period: 'week',
      year: 2026,
      week: 6,
    });

    // ---- Assert ----
    expect(result.period).toBe('week');
    expect(result.summary.transactionCount).toBeGreaterThan(0);
    expect(result.summary.totalSpent).toBeGreaterThan(0);
  });

  it('should support year period', async () => {
    // ---- Act ----
    const result = await service.getSummary({
      userId: 'test-user-001',
      period: 'year',
      year: 2026,
    });

    // ---- Assert ----
    expect(result.period).toBe('year');
    // Should include all 16 transactions (they're all in 2026)
    expect(result.summary.transactionCount).toBe(16);
    expect(result.summary.totalSpent).toBeCloseTo(728.5, 1);
  });

  it('should isolate data by user — different user sees nothing', async () => {
    // ---- Act ----
    const result = await service.getSummary({
      userId: 'test-user-002',
      period: 'month',
      year: 2026,
      month: 2,
    });

    // ---- Assert ----
    expect(result.summary.totalSpent).toBe(0);
    expect(result.summary.transactionCount).toBe(0);
    expect(result.byCategory).toEqual([]);
  });
});

// =========================================================================
// getAlerts
// =========================================================================
describe('DashboardService.getAlerts', () => {
  it('#40 — should return over-budget alert', async () => {
    // ---- Prepare ----
    // Seed additional shopping transactions to push over $300 budget
    transactionRepo.seed({
      id: 'tx-extra-shop-1',
      userId: 'test-user-001',
      categoryId: 'cat-shopping',
      amount: 200,
      vendor: 'EXTRA SHOP',
      description: '',
      transactionDate: '2026-02-15T10:00:00+08:00',
      resendEmailId: null,
      rawEmailSubject: '',
      confidence: Confidence.HIGH,
      source: TransactionSource.MANUAL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    // Now shopping = 135.89 + 200 = 335.89, budget = 300 → over_budget

    // ---- Act ----
    const result = await service.getAlerts({
      userId: 'test-user-001',
      year: 2026,
      month: 2,
    });

    // ---- Assert ----
    const overBudget = result.alerts.filter((a) => a.type === 'over_budget');
    expect(overBudget.length).toBeGreaterThanOrEqual(1);

    const shoppingAlert = overBudget.find((a) => a.categoryId === 'cat-shopping');
    expect(shoppingAlert).toBeDefined();
    expect(shoppingAlert!.spentAmount).toBeCloseTo(335.89, 1);
    expect(shoppingAlert!.budgetAmount).toBe(300);
    expect(shoppingAlert!.overAmount).toBeCloseTo(35.89, 1);
    expect(shoppingAlert!.message).toContain('over');
    expect(shoppingAlert!.message).toContain('Shopping');
  });

  it('#41 — should return warning-level alerts for 80%+ categories', async () => {
    // ---- Prepare ----
    // Modify entertainment budget to make it hit warning (29.48 / X >= 80%)
    // Set budget to 35 → 29.48/35 = 84.2% → warning
    budgetRepo.reset();
    budgetRepo.seed({
      id: 'budget-004-mod',
      userId: 'test-user-001',
      categoryId: 'cat-entertain',
      amount: 35,
      year: 2026,
      month: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // ---- Act ----
    const result = await service.getAlerts({
      userId: 'test-user-001',
      year: 2026,
      month: 2,
    });

    // ---- Assert ----
    const warnings = result.alerts.filter((a) => a.type === 'warning');
    expect(warnings.length).toBeGreaterThanOrEqual(1);

    const entertainAlert = warnings.find((a) => a.categoryId === 'cat-entertain');
    expect(entertainAlert).toBeDefined();
    expect(entertainAlert!.type).toBe('warning');
    expect(entertainAlert!.percentUsed).toBeGreaterThanOrEqual(80);
    expect(entertainAlert!.percentUsed).toBeLessThan(100);
    expect(result.hasWarnings).toBe(true);
  });

  it('#42 — should return no alerts when all categories are on-track', async () => {
    // ---- Prepare ----
    // Default fixture data has all categories well under budget

    // ---- Act ----
    const result = await service.getAlerts({
      userId: 'test-user-001',
      year: 2026,
      month: 2,
    });

    // ---- Assert ----
    expect(result.alerts).toEqual([]);
    expect(result.hasWarnings).toBe(false);
    expect(result.hasOverBudget).toBe(false);
  });

  it('#43 — should sort alerts by severity: over_budget first, then warning', async () => {
    // ---- Prepare ----
    // Create both over-budget and warning scenarios
    // Push shopping over budget
    transactionRepo.seed({
      id: 'tx-extra-shop-2',
      userId: 'test-user-001',
      categoryId: 'cat-shopping',
      amount: 200,
      vendor: 'EXTRA SHOP 2',
      description: '',
      transactionDate: '2026-02-15T10:00:00+08:00',
      resendEmailId: null,
      rawEmailSubject: '',
      confidence: Confidence.HIGH,
      source: TransactionSource.MANUAL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Make entertainment a warning (lower budget to trigger 80%+)
    // entertainment spending = 29.48, set budget to 35 → 84.2%
    const entBudget = budgetsFixture.find((b) => b.category_id === 'cat-entertain');
    if (entBudget) {
      await budgetRepo.update(entBudget.id, { amount: 35 });
    }

    // ---- Act ----
    const result = await service.getAlerts({
      userId: 'test-user-001',
      year: 2026,
      month: 2,
    });

    // ---- Assert ----
    expect(result.alerts.length).toBeGreaterThanOrEqual(2);
    expect(result.hasOverBudget).toBe(true);
    expect(result.hasWarnings).toBe(true);

    // Over-budget alerts should come first
    const firstOverIndex = result.alerts.findIndex((a) => a.type === 'over_budget');
    const firstWarningIndex = result.alerts.findIndex((a) => a.type === 'warning');
    expect(firstOverIndex).toBeLessThan(firstWarningIndex);
  });

  it('should return no alerts for month with no budgets', async () => {
    // ---- Act ----
    const result = await service.getAlerts({
      userId: 'test-user-001',
      year: 2026,
      month: 3,
    });

    // ---- Assert ----
    expect(result.alerts).toEqual([]);
    expect(result.hasWarnings).toBe(false);
    expect(result.hasOverBudget).toBe(false);
  });
});
