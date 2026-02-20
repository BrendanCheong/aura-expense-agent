/**
 * E2E tests — Budget API endpoints.
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
  E2E_BUDGET,
  E2E_BUDGET_2,
  E2E_CATEGORY,
  E2E_CATEGORY_2,
} from './helpers/appwrite-seed';

const API_BASE = '/api/budgets';

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
// GET /api/budgets
// ---------------------------------------------------------------------------

test.describe('GET /api/budgets', () => {
  test('should list budgets with spending data for default month', async ({ request }) => {
    const response = await request.get(`${API_BASE}?year=2026&month=2`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.year).toBe(2026);
    expect(body.month).toBe(2);
    expect(Array.isArray(body.budgets)).toBe(true);
    expect(body.budgets.length).toBeGreaterThanOrEqual(2);
    expect(body.totalBudget).toBeGreaterThanOrEqual(600); // 400 + 200
  });

  test('should include enriched fields on each budget', async ({ request }) => {
    const response = await request.get(`${API_BASE}?year=2026&month=2`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    const foodBudget = body.budgets.find(
      (b: { categoryId: string }) => b.categoryId === E2E_CATEGORY.id
    );
    expect(foodBudget).toBeDefined();
    expect(foodBudget.budgetAmount).toBe(E2E_BUDGET.amount);
    expect(typeof foodBudget.spentAmount).toBe('number');
    expect(typeof foodBudget.remainingAmount).toBe('number');
    expect(typeof foodBudget.percentUsed).toBe('number');
    expect(['on_track', 'warning', 'over_budget']).toContain(foodBudget.status);
  });

  test('should return empty budgets for month with no data', async ({ request }) => {
    const response = await request.get(`${API_BASE}?year=2099&month=1`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.budgets).toEqual([]);
    expect(body.totalBudget).toBe(0);
    expect(body.totalSpent).toBe(0);
  });

  test('should return 400 for invalid query params', async ({ request }) => {
    const response = await request.get(`${API_BASE}?year=-1&month=13`);

    expect(response.status()).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/budgets (strict create)
// ---------------------------------------------------------------------------

test.describe('POST /api/budgets', () => {
  test('should create a new budget and return 201', async ({ request }) => {
    const response = await request.post(API_BASE, {
      data: {
        categoryId: E2E_CATEGORY.id,
        amount: 500,
        year: 2099,
        month: 6,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.categoryId).toBe(E2E_CATEGORY.id);
    expect(body.amount).toBe(500);
    expect(body.year).toBe(2099);
    expect(body.month).toBe(6);

    trackForCleanup('budgets', body.id);
  });

  test('should return 409 when budget already exists for category+period', async ({
    request,
  }) => {
    const response = await request.post(API_BASE, {
      data: {
        categoryId: E2E_BUDGET.category_id,
        amount: 999,
        year: E2E_BUDGET.year,
        month: E2E_BUDGET.month,
      },
    });

    expect(response.status()).toBe(409);
  });

  test('should return 400 for missing required fields', async ({ request }) => {
    const response = await request.post(API_BASE, {
      data: { amount: 100 },
    });

    expect(response.status()).toBe(400);
  });

  test('should return 400 for negative amount', async ({ request }) => {
    const response = await request.post(API_BASE, {
      data: {
        categoryId: E2E_CATEGORY.id,
        amount: -50,
        year: 2026,
        month: 3,
      },
    });

    expect(response.status()).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/budgets (upsert)
// ---------------------------------------------------------------------------

test.describe('PUT /api/budgets', () => {
  test('should create a new budget via upsert and return 201', async ({ request }) => {
    const response = await request.put(API_BASE, {
      data: {
        categoryId: E2E_CATEGORY_2.id,
        amount: 350,
        year: 2099,
        month: 7,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.categoryId).toBe(E2E_CATEGORY_2.id);
    expect(body.amount).toBe(350);

    trackForCleanup('budgets', body.id);
  });

  test('should update an existing budget via upsert and return 200', async ({ request }) => {
    const response = await request.put(API_BASE, {
      data: {
        categoryId: E2E_BUDGET_2.category_id,
        amount: 999,
        year: E2E_BUDGET_2.year,
        month: E2E_BUDGET_2.month,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.amount).toBe(999);
    expect(body.categoryId).toBe(E2E_BUDGET_2.category_id);
  });

  test('should return 400 for invalid body', async ({ request }) => {
    const response = await request.put(API_BASE, {
      data: { categoryId: 'abc' },
    });

    expect(response.status()).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/budgets/[id]
// ---------------------------------------------------------------------------

test.describe('DELETE /api/budgets/[id]', () => {
  test('should return 404 for non-existent budget', async ({ request }) => {
    const response = await request.delete(`${API_BASE}/non-existent-id`);

    expect(response.status()).toBe(404);
  });

  test('should delete a budget and return 204', async ({ request }) => {
    // Create a sacrificial budget to delete
    const createRes = await request.post(API_BASE, {
      data: {
        categoryId: E2E_CATEGORY.id,
        amount: 1,
        year: 2099,
        month: 12,
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    // Delete it
    const deleteRes = await request.delete(`${API_BASE}/${created.id}`);
    expect(deleteRes.status()).toBe(204);

    // Verify it's gone — GET should not return it
    const getRes = await request.get(`${API_BASE}?year=2099&month=12`);
    const list = await getRes.json();
    const found = list.budgets.find(
      (b: { id: string }) => b.id === created.id
    );
    expect(found).toBeUndefined();
  });
});
