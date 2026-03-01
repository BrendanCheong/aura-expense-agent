/**
 * Integration tests — Dashboard API routes.
 *
 * Tests GET /api/dashboard/summary and GET /api/dashboard/alerts
 * through the route handlers with InMemory repositories and mocked auth.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGetRequest, MOCK_USER, OTHER_USER } from '../helpers/request';
import {
  seedBudgets,
  seedCategories,
  seedTransactions,
} from '../helpers/seed';

import type { AuthenticatedUser } from '@/lib/auth/middleware';

import { HttpStatus } from '@/lib/constants';
import { InMemoryBudgetRepository } from '@/lib/repositories/in-memory/budget.repository';
import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import { DashboardService } from '@/lib/services/dashboard.service';

// ---------------------------------------------------------------------------
// Mock setup — must be before route imports
// ---------------------------------------------------------------------------

let _mockUser: AuthenticatedUser | null = MOCK_USER;

vi.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: vi.fn(() => Promise.resolve(_mockUser)),
}));

const _containerRef: {
  dashboardService: DashboardService | null;
} = { dashboardService: null };

vi.mock('@/lib/container/container', () => ({
  createContainer: vi.fn(() => Promise.resolve(_containerRef)),
}));

import { GET as GET_SUMMARY } from '@/app/api/dashboard/summary/route';
import { GET as GET_ALERTS } from '@/app/api/dashboard/alerts/route';
import { Confidence, TransactionSource } from '@/lib/enums';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUMMARY_PATH = '/api/dashboard/summary';
const ALERTS_PATH = '/api/dashboard/alerts';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Integration: Dashboard API Routes', () => {
  let transactionRepo: InMemoryTransactionRepository;
  let budgetRepo: InMemoryBudgetRepository;
  let categoryRepo: InMemoryCategoryRepository;

  beforeAll(() => {
    process.env.PROJECT_ENV = 'dev';
  });

  beforeEach(() => {
    transactionRepo = new InMemoryTransactionRepository();
    budgetRepo = new InMemoryBudgetRepository();
    categoryRepo = new InMemoryCategoryRepository();

    seedCategories(categoryRepo);
    seedTransactions(transactionRepo);
    seedBudgets(budgetRepo);

    const dashboardService = new DashboardService(transactionRepo, budgetRepo, categoryRepo);
    _containerRef.dashboardService = dashboardService;
    _mockUser = MOCK_USER;
  });

  // =========================================================================
  // GET /api/dashboard/summary
  // =========================================================================
  describe('GET /api/dashboard/summary', () => {
    it('should return 200 with summary data for default month', async () => {
      // ---- Act ----
      const response = await GET_SUMMARY(
        createGetRequest(SUMMARY_PATH, 'year=2026&month=2')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.period).toBe('month');
      expect(body.year).toBe(2026);
      expect(body.month).toBe(2);
      expect(body.summary.totalSpent).toBeCloseTo(728.5, 1);
      expect(body.summary.totalBudget).toBe(2700);
      expect(body.summary.transactionCount).toBe(16);
      expect(body.summary.averageTransaction).toBeGreaterThan(0);
    });

    it('should return category breakdown with all spending categories', async () => {
      // ---- Act ----
      const response = await GET_SUMMARY(
        createGetRequest(SUMMARY_PATH, 'year=2026&month=2')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.byCategory.length).toBeGreaterThanOrEqual(7);

      // Verify each category has required fields
      for (const cat of body.byCategory) {
        expect(cat).toHaveProperty('categoryId');
        expect(cat).toHaveProperty('categoryName');
        expect(cat).toHaveProperty('icon');
        expect(cat).toHaveProperty('color');
        expect(cat).toHaveProperty('spent');
        expect(cat).toHaveProperty('budget');
        expect(cat).toHaveProperty('percentage');
        expect(cat).toHaveProperty('transactionCount');
      }
    });

    it('should return max 10 recent transactions sorted by date desc', async () => {
      // ---- Act ----
      const response = await GET_SUMMARY(
        createGetRequest(SUMMARY_PATH, 'year=2026&month=2')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.recentTransactions.length).toBe(10);

      // Verify sorted by date desc
      for (let i = 0; i < body.recentTransactions.length - 1; i++) {
        expect(
          body.recentTransactions[i].transactionDate >=
            body.recentTransactions[i + 1].transactionDate
        ).toBe(true);
      }
    });

    it('should return daily spending aggregation', async () => {
      // ---- Act ----
      const response = await GET_SUMMARY(
        createGetRequest(SUMMARY_PATH, 'year=2026&month=2')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.dailySpending.length).toBeGreaterThan(0);

      // Verify sorted by date asc
      for (let i = 0; i < body.dailySpending.length - 1; i++) {
        expect(body.dailySpending[i].date <= body.dailySpending[i + 1].date).toBe(true);
      }

      // Feb 1 should have 3 transactions totaling 54.48
      const feb1 = body.dailySpending.find(
        (d: { date: string }) => d.date === '2026-02-01'
      );
      expect(feb1).toBeDefined();
      expect(feb1.amount).toBeCloseTo(54.48, 1);
    });

    it('should return empty data for month with no transactions', async () => {
      // ---- Act ----
      const response = await GET_SUMMARY(
        createGetRequest(SUMMARY_PATH, 'year=2026&month=3')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.summary.totalSpent).toBe(0);
      expect(body.summary.transactionCount).toBe(0);
      expect(body.byCategory).toEqual([]);
      expect(body.recentTransactions).toEqual([]);
      expect(body.dailySpending).toEqual([]);
    });

    it('should support week period', async () => {
      // ---- Act ----
      const response = await GET_SUMMARY(
        createGetRequest(SUMMARY_PATH, 'period=week&year=2026&week=6')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.period).toBe('week');
      expect(body.summary.transactionCount).toBeGreaterThan(0);
    });

    it('should support year period', async () => {
      // ---- Act ----
      const response = await GET_SUMMARY(
        createGetRequest(SUMMARY_PATH, 'period=year&year=2026')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.period).toBe('year');
      expect(body.summary.transactionCount).toBe(16);
    });

    it('should return 401 when not authenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await GET_SUMMARY(createGetRequest(SUMMARY_PATH));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for invalid query params', async () => {
      // ---- Act ----
      const response = await GET_SUMMARY(
        createGetRequest(SUMMARY_PATH, 'year=-1&month=13')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should isolate data by user', async () => {
      // ---- Prepare ----
      _mockUser = OTHER_USER;

      // ---- Act ----
      const response = await GET_SUMMARY(
        createGetRequest(SUMMARY_PATH, 'year=2026&month=2')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.summary.totalSpent).toBe(0);
      expect(body.summary.transactionCount).toBe(0);
    });
  });

  // =========================================================================
  // GET /api/dashboard/alerts
  // =========================================================================
  describe('GET /api/dashboard/alerts', () => {
    it('should return 200 with no alerts when all on-track', async () => {
      // ---- Act ----
      const response = await GET_ALERTS(
        createGetRequest(ALERTS_PATH, 'year=2026&month=2')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.alerts).toEqual([]);
      expect(body.hasWarnings).toBe(false);
      expect(body.hasOverBudget).toBe(false);
    });

    it('should return over-budget alert when category exceeds budget', async () => {
      // ---- Prepare ----
      // Add extra shopping transaction to push over $300 budget
      transactionRepo.seed({
        id: 'tx-extra-shop',
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

      // ---- Act ----
      const response = await GET_ALERTS(
        createGetRequest(ALERTS_PATH, 'year=2026&month=2')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.hasOverBudget).toBe(true);
      const shoppingAlert = body.alerts.find(
        (a: { categoryId: string }) => a.categoryId === 'cat-shopping'
      );
      expect(shoppingAlert).toBeDefined();
      expect(shoppingAlert.type).toBe('over_budget');
      expect(shoppingAlert.overAmount).toBeGreaterThan(0);
      expect(shoppingAlert.message).toContain('over');
    });

    it('should return warning alert when category is at 80%+', async () => {
      // ---- Prepare ----
      // Lower entertainment budget to trigger warning: 29.48 / 35 = 84.2%
      await budgetRepo.update('budget-004', { amount: 35 });

      // ---- Act ----
      const response = await GET_ALERTS(
        createGetRequest(ALERTS_PATH, 'year=2026&month=2')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.hasWarnings).toBe(true);
      const entertainAlert = body.alerts.find(
        (a: { categoryId: string }) => a.categoryId === 'cat-entertain'
      );
      expect(entertainAlert).toBeDefined();
      expect(entertainAlert.type).toBe('warning');
    });

    it('should sort alerts over_budget first then warning', async () => {
      // ---- Prepare ----
      // Push shopping over budget
      transactionRepo.seed({
        id: 'tx-extra-shop-sort',
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
      // Lower entertainment budget for warning
      await budgetRepo.update('budget-004', { amount: 35 });

      // ---- Act ----
      const response = await GET_ALERTS(
        createGetRequest(ALERTS_PATH, 'year=2026&month=2')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.alerts.length).toBeGreaterThanOrEqual(2);

      const firstOverIdx = body.alerts.findIndex(
        (a: { type: string }) => a.type === 'over_budget'
      );
      const firstWarnIdx = body.alerts.findIndex(
        (a: { type: string }) => a.type === 'warning'
      );
      expect(firstOverIdx).toBeLessThan(firstWarnIdx);
    });

    it('should return 401 when not authenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await GET_ALERTS(createGetRequest(ALERTS_PATH));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return empty alerts for month with no budgets', async () => {
      // ---- Act ----
      const response = await GET_ALERTS(
        createGetRequest(ALERTS_PATH, 'year=2026&month=3')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.alerts).toEqual([]);
      expect(body.hasWarnings).toBe(false);
      expect(body.hasOverBudget).toBe(false);
    });

    it('should default to current month when period not specified', async () => {
      // ---- Act ----
      const response = await GET_ALERTS(createGetRequest(ALERTS_PATH));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body).toHaveProperty('alerts');
      expect(body).toHaveProperty('hasWarnings');
      expect(body).toHaveProperty('hasOverBudget');
    });
  });
});
