/**
 * Integration tests — Category cascade operations.
 *
 * Tests DELETE /api/categories/[id] cascade through the route handler,
 * and PATCH/POST /api/transactions for cross-service side effects.
 * Uses InMemory repositories with mocked auth.
 *
 * Pattern: Prepare → Act → Assert
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createDeleteRequest,
  createGetRequest,
  createPatchRequest,
  createPostRequest,
  MOCK_USER,
  routeContext,
} from '../helpers/request';
import {
  seedBudgets,
  seedCategories,
  seedTransactions,
  seedVendorCache,
  transactionsFixture,
} from '../helpers/seed';

import type { AuthenticatedUser } from '@/lib/auth/middleware';

import { HttpStatus } from '@/lib/constants';
import { InMemoryBudgetRepository } from '@/lib/repositories/in-memory/budget.repository';
import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import { InMemoryVendorCacheRepository } from '@/lib/repositories/in-memory/vendor-cache.repository';
import { BudgetService } from '@/lib/services/budget.service';
import { CategoryService } from '@/lib/services/category.service';
import { TransactionService } from '@/lib/services/transaction.service';

// ---------------------------------------------------------------------------
// Mock setup — must be before route imports
// ---------------------------------------------------------------------------

let _mockUser: AuthenticatedUser | null = MOCK_USER;

vi.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: vi.fn(() => Promise.resolve(_mockUser)),
}));

const _containerRef: {
  categoryService: CategoryService | null;
  transactionService: TransactionService | null;
  budgetService: BudgetService | null;
} = { categoryService: null, transactionService: null, budgetService: null };

vi.mock('@/lib/container/container', () => ({
  createContainer: vi.fn(() => Promise.resolve(_containerRef)),
}));

import { DELETE as DELETE_CATEGORY } from '@/app/api/categories/[id]/route';
import { GET as GET_TRANSACTIONS, POST as POST_TRANSACTION } from '@/app/api/transactions/route';
import { PATCH as PATCH_TRANSACTION } from '@/app/api/transactions/[id]/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CAT_PATH = '/api/categories';
const TX_PATH = '/api/transactions';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Integration: Category Cascade (DELETE /api/categories/[id])', () => {
  let categoryRepo: InMemoryCategoryRepository;
  let vendorCacheRepo: InMemoryVendorCacheRepository;
  let budgetRepo: InMemoryBudgetRepository;
  let transactionRepo: InMemoryTransactionRepository;

  beforeAll(() => {
    process.env.PROJECT_ENV = 'dev';
  });

  beforeEach(() => {
    categoryRepo = new InMemoryCategoryRepository();
    vendorCacheRepo = new InMemoryVendorCacheRepository();
    budgetRepo = new InMemoryBudgetRepository();
    transactionRepo = new InMemoryTransactionRepository();

    const categoryService = new CategoryService(
      categoryRepo,
      vendorCacheRepo,
      budgetRepo,
      transactionRepo
    );
    const transactionService = new TransactionService(transactionRepo, vendorCacheRepo);
    const budgetService = new BudgetService(budgetRepo, transactionRepo);

    seedCategories(categoryRepo);
    seedVendorCache(vendorCacheRepo);
    seedBudgets(budgetRepo);
    seedTransactions(transactionRepo);

    _containerRef.categoryService = categoryService;
    _containerRef.transactionService = transactionService;
    _containerRef.budgetService = budgetService;
    _mockUser = MOCK_USER;
  });

  // =========================================================================
  // DELETE cascade — transactions move to Other
  // =========================================================================
  it('should move transactions to Other when category is deleted', async () => {
    // ---- Act ----
    const response = await DELETE_CATEGORY(
      createDeleteRequest(`${CAT_PATH}/cat-transport`),
      routeContext('cat-transport')
    );

    // ---- Assert — route returns 204 ----
    expect(response.status).toBe(HttpStatus.NO_CONTENT);

    // Verify transactions moved to "Other"
    const tx002 = await transactionRepo.findById('tx-002');
    expect(tx002!.categoryId).toBe('cat-other');
    expect(tx002!.vendor).toBe('MRT TOP-UP');

    const tx006 = await transactionRepo.findById('tx-006');
    expect(tx006!.categoryId).toBe('cat-other');

    // Verify no transactions lost via API
    const listResponse = await GET_TRANSACTIONS(createGetRequest(TX_PATH, 'limit=100'));
    const list = await listResponse.json();
    expect(list.total).toBe(16);
  });

  // =========================================================================
  // DELETE cascade — vendor cache cleaned
  // =========================================================================
  it('should clean vendor cache when category is deleted', async () => {
    // ---- Act ----
    await DELETE_CATEGORY(
      createDeleteRequest(`${CAT_PATH}/cat-transport`),
      routeContext('cat-transport')
    );

    // ---- Assert ----
    const vendorEntries = await vendorCacheRepo.findByUserId(MOCK_USER.accountId);
    const transportVendors = vendorEntries.filter((v) => v.categoryId === 'cat-transport');
    expect(transportVendors).toHaveLength(0);
    expect(vendorEntries.length).toBe(6); // 7 original - 1 deleted
  });

  // =========================================================================
  // DELETE cascade — budgets removed
  // =========================================================================
  it('should remove budgets when category is deleted', async () => {
    // ---- Act ----
    await DELETE_CATEGORY(
      createDeleteRequest(`${CAT_PATH}/cat-transport`),
      routeContext('cat-transport')
    );

    // ---- Assert ----
    const budgets = await budgetRepo.findByUserAndPeriod(MOCK_USER.accountId, 2026, 2);
    const transportBudgets = budgets.filter((b) => b.categoryId === 'cat-transport');
    expect(transportBudgets).toHaveLength(0);
    expect(budgets.length).toBe(7); // 8 original - 1 deleted
  });

  // =========================================================================
  // DELETE — cannot delete "Other"
  // =========================================================================
  it('should return 400 when deleting the "Other" system category', async () => {
    // ---- Act ----
    const response = await DELETE_CATEGORY(
      createDeleteRequest(`${CAT_PATH}/cat-other`),
      routeContext('cat-other')
    );

    // ---- Assert ----
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    const body = await response.json();
    expect(body.error).toContain('Cannot delete');

    // Verify category still exists
    const other = await categoryRepo.findById('cat-other');
    expect(other).not.toBeNull();
    expect(other!.name).toBe('Other');
  });

  // =========================================================================
  // Full cascade — delete category with all related data
  // =========================================================================
  it('should cascade-delete transactions, vendor cache, and budgets for a category', async () => {
    // ---- Prepare ----
    const foodTxBefore = transactionsFixture.filter((tx) => tx.category_id === 'cat-food');

    // ---- Act ----
    const response = await DELETE_CATEGORY(
      createDeleteRequest(`${CAT_PATH}/cat-food`),
      routeContext('cat-food')
    );

    // ---- Assert ----
    expect(response.status).toBe(HttpStatus.NO_CONTENT);

    // Category deleted
    expect(await categoryRepo.findById('cat-food')).toBeNull();

    // All food transactions moved to Other
    for (const txFixture of foodTxBefore) {
      const tx = await transactionRepo.findById(txFixture.id);
      expect(tx!.categoryId).toBe('cat-other');
    }

    // Vendor cache cleaned
    const allVendors = await vendorCacheRepo.findByUserId(MOCK_USER.accountId);
    expect(allVendors.filter((v) => v.categoryId === 'cat-food')).toHaveLength(0);

    // Budget removed
    const budgets = await budgetRepo.findByUserAndPeriod(MOCK_USER.accountId, 2026, 2);
    expect(budgets.filter((b) => b.categoryId === 'cat-food')).toHaveLength(0);
  });

  // =========================================================================
  // Cross-service: PATCH transaction → vendor cache updated
  // =========================================================================
  it('should update vendor cache when transaction is re-categorized', async () => {
    // ---- Act — re-categorize tx-001 (GRAB *GRABFOOD, cat-food) → cat-shopping ----
    const response = await PATCH_TRANSACTION(
      createPatchRequest(`${TX_PATH}/tx-001`, { categoryId: 'cat-shopping' }),
      routeContext('tx-001')
    );

    // ---- Assert ----
    expect(response.status).toBe(HttpStatus.OK);
    const body = await response.json();
    expect(body.categoryId).toBe('cat-shopping');

    // Vendor cache for GRAB *GRABFOOD should now point to cat-shopping
    const cached = await vendorCacheRepo.findByUserAndVendor(
      MOCK_USER.accountId,
      'GRAB *GRABFOOD'
    );
    expect(cached).not.toBeNull();
    expect(cached!.categoryId).toBe('cat-shopping');
  });

  // =========================================================================
  // Cross-service: POST transaction → vendor cache created
  // =========================================================================
  it('should create vendor cache entry when manual transaction is added', async () => {
    // ---- Act ----
    const response = await POST_TRANSACTION(
      createPostRequest(TX_PATH, {
        amount: 25.5,
        vendor: 'Hawker Centre',
        categoryId: 'cat-food',
        transactionDate: '2026-02-14T12:00:00+08:00',
        description: 'Chicken rice',
      })
    );

    // ---- Assert ----
    expect(response.status).toBe(HttpStatus.CREATED);
    const body = await response.json();
    expect(body.source).toBe('manual');
    expect(body.confidence).toBe('high');

    // Vendor cache should have entry for HAWKER CENTRE
    const cached = await vendorCacheRepo.findByUserAndVendor(
      MOCK_USER.accountId,
      'HAWKER CENTRE'
    );
    expect(cached).not.toBeNull();
    expect(cached!.categoryId).toBe('cat-food');
  });
});
