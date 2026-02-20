/**
 * Integration tests — Budget API routes.
 *
 * Tests GET/POST/PUT/DELETE /api/budgets through the route handlers
 * with InMemory repositories and mocked auth.
 *
 * Pattern: Prepare → Act → Assert
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createDeleteRequest,
  createGetRequest,
  createPostRequest,
  MOCK_USER,
  OTHER_USER,
  routeContext,
} from '../helpers/request';
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
import { BudgetService } from '@/lib/services/budget.service';

// ---------------------------------------------------------------------------
// Mock setup — must be before route imports
// ---------------------------------------------------------------------------

let _mockUser: AuthenticatedUser | null = MOCK_USER;

vi.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: vi.fn(() => Promise.resolve(_mockUser)),
}));

const _containerRef: {
  budgetService: BudgetService | null;
} = { budgetService: null };

vi.mock('@/lib/container/container', () => ({
  createContainer: vi.fn(() => Promise.resolve(_containerRef)),
}));

import { GET, POST, PUT } from '@/app/api/budgets/route';
import { DELETE } from '@/app/api/budgets/[id]/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUDGET_PATH = '/api/budgets';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Integration: Budget API Routes', () => {
  let budgetRepo: InMemoryBudgetRepository;
  let transactionRepo: InMemoryTransactionRepository;
  let categoryRepo: InMemoryCategoryRepository;

  beforeAll(() => {
    process.env.PROJECT_ENV = 'dev';
  });

  beforeEach(() => {
    budgetRepo = new InMemoryBudgetRepository();
    transactionRepo = new InMemoryTransactionRepository();
    categoryRepo = new InMemoryCategoryRepository();

    const budgetService = new BudgetService(budgetRepo, transactionRepo);

    seedCategories(categoryRepo);
    seedBudgets(budgetRepo);
    seedTransactions(transactionRepo);

    _containerRef.budgetService = budgetService;
    _mockUser = MOCK_USER;
  });

  // =========================================================================
  // GET /api/budgets
  // =========================================================================
  describe('GET /api/budgets', () => {
    it('should return enriched budgets for Feb 2026', async () => {
      // ---- Act ----
      const response = await GET(createGetRequest(BUDGET_PATH, 'year=2026&month=2'));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.budgets).toHaveLength(8);
      expect(body.totalBudget).toBeGreaterThan(0);
      expect(body.year).toBe(2026);
      expect(body.month).toBe(2);

      // Verify enrichment
      for (const budget of body.budgets) {
        expect(budget).toHaveProperty('budgetAmount');
        expect(budget).toHaveProperty('spentAmount');
        expect(budget).toHaveProperty('remainingAmount');
        expect(budget).toHaveProperty('percentUsed');
        expect(budget).toHaveProperty('status');
      }
    });

    it('should return empty for month with no budgets', async () => {
      // ---- Act ----
      const response = await GET(createGetRequest(BUDGET_PATH, 'year=2026&month=3'));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.budgets).toHaveLength(0);
      expect(body.totalBudget).toBe(0);
    });

    it('should use current year/month as defaults', async () => {
      // ---- Act ----
      const response = await GET(createGetRequest(BUDGET_PATH));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.year).toBeDefined();
      expect(body.month).toBeDefined();
    });

    it('should return 401 when unauthenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await GET(createGetRequest(BUDGET_PATH));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  // =========================================================================
  // POST /api/budgets
  // =========================================================================
  describe('POST /api/budgets', () => {
    const validBody = {
      categoryId: 'cat-food',
      amount: 450,
      year: 2026,
      month: 3,
    };

    it('should create a new budget and return 201', async () => {
      // ---- Act ----
      const response = await POST(createPostRequest(BUDGET_PATH, validBody));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.CREATED);
      const body = await response.json();
      expect(body.id).toBeDefined();
      expect(body.amount).toBe(450);
      expect(body.categoryId).toBe('cat-food');
    });

    it('should return 409 when budget already exists for period', async () => {
      // ---- Act ----
      const response = await POST(
        createPostRequest(BUDGET_PATH, {
          categoryId: 'cat-food',
          amount: 500,
          year: 2026,
          month: 2,
        })
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.CONFLICT);
    });

    it('should return 400 for invalid body', async () => {
      // ---- Act ----
      const response = await POST(createPostRequest(BUDGET_PATH, { amount: -10 }));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 401 when unauthenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await POST(createPostRequest(BUDGET_PATH, validBody));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  // =========================================================================
  // PUT /api/budgets
  // =========================================================================
  describe('PUT /api/budgets', () => {
    it('should create a new budget when none exists (201)', async () => {
      // ---- Act ----
      const response = await PUT(
        createPostRequest(BUDGET_PATH, {
          categoryId: 'cat-food',
          amount: 300,
          year: 2026,
          month: 3,
        })
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.CREATED);
      const body = await response.json();
      expect(body.amount).toBe(300);
    });

    it('should update existing budget (200)', async () => {
      // ---- Act ----
      const response = await PUT(
        createPostRequest(BUDGET_PATH, {
          categoryId: 'cat-food',
          amount: 500,
          year: 2026,
          month: 2,
        })
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.amount).toBe(500);
    });

    it('should return 400 for invalid body', async () => {
      // ---- Act ----
      const response = await PUT(createPostRequest(BUDGET_PATH, {}));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 401 when unauthenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await PUT(
        createPostRequest(BUDGET_PATH, {
          categoryId: 'cat-food',
          amount: 300,
          year: 2026,
          month: 3,
        })
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  // =========================================================================
  // DELETE /api/budgets/[id]
  // =========================================================================
  describe('DELETE /api/budgets/[id]', () => {
    it('should delete a budget and return 204', async () => {
      // ---- Prepare ----
      const budgets = await budgetRepo.findByUserAndPeriod(MOCK_USER.accountId, 2026, 2);
      const targetId = budgets[0].id;

      // ---- Act ----
      const response = await DELETE(
        createDeleteRequest(`${BUDGET_PATH}/${targetId}`),
        routeContext(targetId)
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.NO_CONTENT);
      const found = await budgetRepo.findById(targetId);
      expect(found).toBeNull();
    });

    it('should return 404 for non-existent budget', async () => {
      // ---- Act ----
      const response = await DELETE(
        createDeleteRequest(`${BUDGET_PATH}/nonexistent`),
        routeContext('nonexistent')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return 404 when another user tries to delete', async () => {
      // ---- Prepare ----
      const budgets = await budgetRepo.findByUserAndPeriod(MOCK_USER.accountId, 2026, 2);
      const targetId = budgets[0].id;
      _mockUser = OTHER_USER;

      // ---- Act ----
      const response = await DELETE(
        createDeleteRequest(`${BUDGET_PATH}/${targetId}`),
        routeContext(targetId)
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return 401 when unauthenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await DELETE(
        createDeleteRequest(`${BUDGET_PATH}/budget-001`),
        routeContext('budget-001')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
