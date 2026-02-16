/**
 * E2E tests — Transaction API endpoints.
 *
 * API-only tests (no browser). Runs against the real dev server with
 * PROJECT_ENV=dev for auth bypass (returns dev-user-001).
 *
 * Data is seeded/torn down via Appwrite SDK in beforeAll/afterAll.
 *
 * Pattern: Prepare → Act → Assert
 */

import { test, expect } from '@playwright/test';

import {
  seedE2EData,
  teardownE2EData,
  trackForCleanup,
  E2E_TRANSACTION,
  E2E_TRANSACTION_2,
  E2E_CATEGORY,
  E2E_CATEGORY_2,
} from './helpers/appwrite-seed';

const API_BASE = '/api/transactions';

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

test.beforeAll(async () => {
  await seedE2EData();
});

test.afterAll(async () => {
  await teardownE2EData();
});

// ---------------------------------------------------------------------------
// GET /api/transactions
// ---------------------------------------------------------------------------

test.describe('GET /api/transactions', () => {
  test('should list transactions for authenticated user', async ({ request }) => {
    const response = await request.get(API_BASE);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(2);
    expect(body.page).toBe(1);
  });

  test('should support pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE}?page=1&limit=1`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.length).toBeLessThanOrEqual(1);
    expect(body.limit).toBe(1);
  });

  test('should filter by categoryId', async ({ request }) => {
    const response = await request.get(`${API_BASE}?categoryId=${E2E_CATEGORY.id}`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    for (const tx of body.data) {
      expect(tx.categoryId).toBe(E2E_CATEGORY.id);
    }
  });

  test('should filter by source=manual', async ({ request }) => {
    const response = await request.get(`${API_BASE}?source=manual`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    for (const tx of body.data) {
      expect(tx.source).toBe('manual');
    }
  });

  test('should return 400 for invalid query params', async ({ request }) => {
    const response = await request.get(`${API_BASE}?page=-1`);

    expect(response.status()).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/transactions
// ---------------------------------------------------------------------------

test.describe('POST /api/transactions', () => {
  test('should create a manual transaction', async ({ request }) => {
    const response = await request.post(API_BASE, {
      data: {
        amount: 42.0,
        vendor: 'E2E_NEW_VENDOR',
        categoryId: E2E_CATEGORY.id,
        transactionDate: '2026-02-12T10:00:00+08:00',
        description: 'Created by e2e test',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.amount).toBe(42.0);
    expect(body.vendor).toBe('E2E_NEW_VENDOR');
    expect(body.source).toBe('manual');
    expect(body.confidence).toBe('high');

    // Track for cleanup
    trackForCleanup('transactions', body.id);
  });

  test('should return 400 for missing required fields', async ({ request }) => {
    const response = await request.post(API_BASE, {
      data: { amount: 10 },
    });

    expect(response.status()).toBe(400);
  });

  test('should return 400 for negative amount', async ({ request }) => {
    const response = await request.post(API_BASE, {
      data: {
        amount: -5,
        vendor: 'BAD',
        categoryId: E2E_CATEGORY.id,
        transactionDate: '2026-02-12T10:00:00+08:00',
      },
    });

    expect(response.status()).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/transactions/[id]
// ---------------------------------------------------------------------------

test.describe('PATCH /api/transactions/[id]', () => {
  test('should update a transaction amount', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/${E2E_TRANSACTION.id}`, {
      data: { amount: 99.99 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(E2E_TRANSACTION.id);
    expect(body.amount).toBe(99.99);
  });

  test('should update transaction category', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/${E2E_TRANSACTION_2.id}`, {
      data: { categoryId: E2E_CATEGORY.id },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.categoryId).toBe(E2E_CATEGORY.id);
  });

  test('should return 404 for non-existent transaction', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/non-existent-id`, {
      data: { amount: 10 },
    });

    expect(response.status()).toBe(404);
  });

  test('should return 400 for empty update body', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/${E2E_TRANSACTION.id}`, {
      data: {},
    });

    expect(response.status()).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/transactions/[id]
// ---------------------------------------------------------------------------

test.describe('DELETE /api/transactions/[id]', () => {
  test('should return 404 for non-existent transaction', async ({ request }) => {
    const response = await request.delete(`${API_BASE}/non-existent-id`);

    expect(response.status()).toBe(404);
  });

  test('should delete a transaction and return 204', async ({ request }) => {
    // Create a sacrificial transaction to delete
    const createRes = await request.post(API_BASE, {
      data: {
        amount: 1.0,
        vendor: 'E2E_DELETE_ME',
        categoryId: E2E_CATEGORY_2.id,
        transactionDate: '2026-02-13T12:00:00+08:00',
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    // Delete it
    const deleteRes = await request.delete(`${API_BASE}/${created.id}`);
    expect(deleteRes.status()).toBe(204);

    // Verify it's gone
    const getRes = await request.get(`${API_BASE}?limit=100`);
    const list = await getRes.json();
    const found = list.data.find((tx: { id: string }) => tx.id === created.id);
    expect(found).toBeUndefined();
  });
});
