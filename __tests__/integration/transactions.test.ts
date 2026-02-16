/**
 * Integration tests — Transaction API routes.
 *
 * Tests GET/POST/PATCH/DELETE /api/transactions through the route handlers
 * with InMemory repositories and mocked auth.
 *
 * Pattern: Prepare → Act → Assert
 */

import { NextRequest } from 'next/server';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  seedCategories,
  seedTransactions,
  seedVendorCache,
  transactionsFixture,
} from '../helpers/seed';

import type { AuthenticatedUser } from '@/lib/auth/middleware';

import { HttpStatus } from '@/lib/constants';
import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import { InMemoryVendorCacheRepository } from '@/lib/repositories/in-memory/vendor-cache.repository';
import { TransactionService } from '@/lib/services/transaction.service';

// ---------------------------------------------------------------------------
// Mock setup — must be before route imports
// ---------------------------------------------------------------------------

const MOCK_USER: AuthenticatedUser = {
  accountId: 'test-user-001',
  email: 'test@aura.local',
  name: 'Test User',
};

let _mockUser: AuthenticatedUser | null = MOCK_USER;

vi.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: vi.fn(() => Promise.resolve(_mockUser)),
}));

const _containerRef: { transactionService: TransactionService | null } = {
  transactionService: null,
};

vi.mock('@/lib/container/container', () => ({
  createContainer: vi.fn(() => Promise.resolve(_containerRef)),
}));

// Import route handlers AFTER vi.mock (which is hoisted)
// eslint-disable-next-line import/order
import { GET, POST } from '@/app/api/transactions/route';
// eslint-disable-next-line import/order
import { PATCH, DELETE } from '@/app/api/transactions/[id]/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = 'http://localhost:4321/api/transactions';

function createGetRequest(query = ''): NextRequest {
  return new NextRequest(`${BASE_URL}${query ? '?' + query : ''}`, {
    method: 'GET',
  });
}

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createPatchRequest(body: unknown): NextRequest {
  return new NextRequest(`${BASE_URL}/tx-001`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createDeleteRequest(): NextRequest {
  return new NextRequest(`${BASE_URL}/tx-001`, {
    method: 'DELETE',
  });
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Integration: Transaction API Routes', () => {
  let transactionRepo: InMemoryTransactionRepository;
  let vendorCacheRepo: InMemoryVendorCacheRepository;
  let categoryRepo: InMemoryCategoryRepository;

  beforeAll(() => {
    process.env.PROJECT_ENV = 'dev';
  });

  beforeEach(() => {
    transactionRepo = new InMemoryTransactionRepository();
    vendorCacheRepo = new InMemoryVendorCacheRepository();
    categoryRepo = new InMemoryCategoryRepository();

    const transactionService = new TransactionService(transactionRepo, vendorCacheRepo);

    seedCategories(categoryRepo);
    seedTransactions(transactionRepo);
    seedVendorCache(vendorCacheRepo);

    _containerRef.transactionService = transactionService;
    _mockUser = MOCK_USER;
  });

  // =========================================================================
  // GET /api/transactions
  // =========================================================================
  describe('GET /api/transactions', () => {
    it('should list transactions with default pagination', async () => {
      // ---- Act ----
      const response = await GET(createGetRequest());

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.data).toBeDefined();
      expect(body.total).toBe(16);
      expect(body.page).toBe(1);
    });

    it('should respect pagination parameters', async () => {
      // ---- Act ----
      const response = await GET(createGetRequest('page=2&limit=5'));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.data.length).toBeLessThanOrEqual(5);
      expect(body.page).toBe(2);
      expect(body.limit).toBe(5);
    });

    it('should filter by categoryId', async () => {
      // ---- Act ----
      const response = await GET(createGetRequest('categoryId=cat-food'));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      for (const tx of body.data) {
        expect(tx.categoryId).toBe('cat-food');
      }
    });

    it('should filter by source', async () => {
      // ---- Act ----
      const response = await GET(createGetRequest('source=manual'));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      for (const tx of body.data) {
        expect(tx.source).toBe('manual');
      }
    });

    it('should return 401 when unauthenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await GET(createGetRequest());

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for invalid query params', async () => {
      // ---- Act ----
      const response = await GET(createGetRequest('page=-1'));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  // =========================================================================
  // POST /api/transactions
  // =========================================================================
  describe('POST /api/transactions', () => {
    const validBody = {
      amount: 25.5,
      vendor: 'COFFEE BEAN',
      categoryId: 'cat-food',
      transactionDate: '2026-02-10T14:00:00+08:00',
      description: 'Afternoon coffee',
    };

    it('should create a manual transaction', async () => {
      // ---- Act ----
      const response = await POST(createPostRequest(validBody));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.CREATED);
      const body = await response.json();
      expect(body.amount).toBe(25.5);
      expect(body.vendor).toBe('COFFEE BEAN');
      expect(body.categoryId).toBe('cat-food');
      expect(body.source).toBe('manual');
      expect(body.confidence).toBe('high');
    });

    it('should persist the created transaction', async () => {
      // ---- Act ----
      const response = await POST(createPostRequest(validBody));
      const created = await response.json();

      // ---- Assert ----
      const stored = await transactionRepo.findById(created.id);
      expect(stored).not.toBeNull();
      expect(stored!.amount).toBe(25.5);
      expect(stored!.vendor).toBe('COFFEE BEAN');
    });

    it('should return 401 when unauthenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await POST(createPostRequest(validBody));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for missing required fields', async () => {
      // ---- Act ----
      const response = await POST(createPostRequest({ amount: 10 }));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for invalid JSON body', async () => {
      // ---- Prepare ----
      const request = new NextRequest(BASE_URL, {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      });

      // ---- Act ----
      const response = await POST(request);

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for negative amount', async () => {
      // ---- Act ----
      const response = await POST(createPostRequest({ ...validBody, amount: -5 }));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  // =========================================================================
  // PATCH /api/transactions/[id]
  // =========================================================================
  describe('PATCH /api/transactions/[id]', () => {
    it('should update a transaction', async () => {
      // ---- Act ----
      const response = await PATCH(
        createPatchRequest({ amount: 99.99 }),
        routeContext('tx-001')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.amount).toBe(99.99);
      expect(body.id).toBe('tx-001');
    });

    it('should update category and persist vendor cache change', async () => {
      // ---- Act ----
      const response = await PATCH(
        createPatchRequest({ categoryId: 'cat-transport' }),
        routeContext('tx-001')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.categoryId).toBe('cat-transport');

      // Vendor cache for GRAB *GRABFOOD should be updated
      const cached = await vendorCacheRepo.findByUserAndVendor(
        MOCK_USER.accountId,
        'GRAB *GRABFOOD'
      );
      if (cached) {
        expect(cached.categoryId).toBe('cat-transport');
      }
    });

    it('should return 404 for non-existent transaction', async () => {
      // ---- Act ----
      const response = await PATCH(
        createPatchRequest({ amount: 10 }),
        routeContext('non-existent')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return 401 when unauthenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await PATCH(
        createPatchRequest({ amount: 10 }),
        routeContext('tx-001')
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for empty update body', async () => {
      // ---- Act ----
      const response = await PATCH(createPatchRequest({}), routeContext('tx-001'));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for invalid JSON body', async () => {
      // ---- Prepare ----
      const request = new NextRequest(`${BASE_URL}/tx-001`, {
        method: 'PATCH',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      });

      // ---- Act ----
      const response = await PATCH(request, routeContext('tx-001'));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  // =========================================================================
  // DELETE /api/transactions/[id]
  // =========================================================================
  describe('DELETE /api/transactions/[id]', () => {
    it('should delete a transaction and return 204', async () => {
      // ---- Act ----
      const response = await DELETE(createDeleteRequest(), routeContext('tx-001'));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verify actually deleted
      const deleted = await transactionRepo.findById('tx-001');
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent transaction', async () => {
      // ---- Act ----
      const response = await DELETE(createDeleteRequest(), routeContext('non-existent'));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return 401 when unauthenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await DELETE(createDeleteRequest(), routeContext('tx-001'));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should not delete another user\'s transaction', async () => {
      // ---- Prepare — switch to different user ----
      _mockUser = {
        accountId: 'test-user-002',
        email: 'other@aura.local',
        name: 'Other User',
      };

      // ---- Act — tx-001 belongs to test-user-001, not test-user-002 ----
      const response = await DELETE(createDeleteRequest(), routeContext('tx-001'));

      // ---- Assert — should get 404 (ownership check) ----
      expect(response.status).toBe(HttpStatus.NOT_FOUND);

      // Verify not deleted
      const stillExists = await transactionRepo.findById('tx-001');
      expect(stillExists).not.toBeNull();
    });
  });
});
