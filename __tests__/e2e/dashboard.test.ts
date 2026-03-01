/**
 * E2E tests — Dashboard API endpoints.
 *
 * API-only tests (no browser). Runs against the real dev server with
 * PROJECT_ENV=dev for auth bypass (returns dev-user-001).
 */

import { test, expect } from '@playwright/test';

import {
  seedE2EData,
  teardownE2EData,
  E2E_CATEGORY,
  E2E_CATEGORY_2,
  E2E_TRANSACTION,
  E2E_TRANSACTION_2,
  E2E_DASH_CATEGORY,
  E2E_DASH_BUDGET,
  E2E_DASH_TX,
} from './helpers/appwrite-seed';

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

test.beforeAll(async () => {
  await seedE2EData();
});

test.afterAll(async () => {
  await teardownE2EData();
});

// ===========================================================================
// GET /api/dashboard/summary
// ===========================================================================

test.describe('GET /api/dashboard/summary', () => {
  test('should return summary for default period (month)', async ({ request }) => {
    const response = await request.get('/api/dashboard/summary?year=2026&month=2');

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.period).toBe('month');
    expect(body.year).toBe(2026);
    expect(body.month).toBe(2);
    expect(body.summary).toBeDefined();
    expect(typeof body.summary.totalSpent).toBe('number');
    expect(typeof body.summary.totalBudget).toBe('number');
    expect(typeof body.summary.transactionCount).toBe('number');
    expect(typeof body.summary.averageTransaction).toBe('number');
  });

  test('should include category breakdown with correct structure', async ({ request }) => {
    const response = await request.get('/api/dashboard/summary?year=2026&month=2');

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(Array.isArray(body.byCategory)).toBe(true);
    expect(body.byCategory.length).toBeGreaterThanOrEqual(2);

    // Check structure of at least one entry
    const first = body.byCategory[0];
    expect(first).toHaveProperty('categoryId');
    expect(first).toHaveProperty('categoryName');
    expect(first).toHaveProperty('icon');
    expect(first).toHaveProperty('color');
    expect(first).toHaveProperty('spent');
    expect(first).toHaveProperty('budget');
    expect(first).toHaveProperty('percentage');
    expect(first).toHaveProperty('transactionCount');
  });

  test('should include the seeded transactions in totals', async ({ request }) => {
    const response = await request.get('/api/dashboard/summary?year=2026&month=2');

    expect(response.status()).toBe(200);
    const body = await response.json();

    // At minimum, the e2e seed data has 3 transactions in Feb 2026
    const minSpent = E2E_TRANSACTION.amount + E2E_TRANSACTION_2.amount + E2E_DASH_TX.amount;
    expect(body.summary.totalSpent).toBeGreaterThanOrEqual(minSpent);
    expect(body.summary.transactionCount).toBeGreaterThanOrEqual(3);
  });

  test('should include recent transactions', async ({ request }) => {
    const response = await request.get('/api/dashboard/summary?year=2026&month=2');

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(Array.isArray(body.recentTransactions)).toBe(true);
    expect(body.recentTransactions.length).toBeGreaterThanOrEqual(1);

    // Check structure
    const tx = body.recentTransactions[0];
    expect(tx).toHaveProperty('id');
    expect(tx).toHaveProperty('vendor');
    expect(tx).toHaveProperty('amount');
    expect(tx).toHaveProperty('categoryName');
    expect(tx).toHaveProperty('transactionDate');
  });

  test('should include daily spending', async ({ request }) => {
    const response = await request.get('/api/dashboard/summary?year=2026&month=2');

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(Array.isArray(body.dailySpending)).toBe(true);
    expect(body.dailySpending.length).toBeGreaterThanOrEqual(1);

    const day = body.dailySpending[0];
    expect(day).toHaveProperty('date');
    expect(day).toHaveProperty('amount');
  });

  test('should return empty data for month with no transactions', async ({ request }) => {
    const response = await request.get('/api/dashboard/summary?year=2099&month=1');

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.summary.totalSpent).toBe(0);
    expect(body.summary.transactionCount).toBe(0);
    expect(body.byCategory).toEqual([]);
    expect(body.recentTransactions).toEqual([]);
    expect(body.dailySpending).toEqual([]);
  });

  test('should support year period', async ({ request }) => {
    const response = await request.get('/api/dashboard/summary?period=year&year=2026');

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.period).toBe('year');
    expect(body.year).toBe(2026);
    // Year summary should include all 2026 transactions
    expect(body.summary.totalSpent).toBeGreaterThanOrEqual(
      E2E_TRANSACTION.amount + E2E_TRANSACTION_2.amount + E2E_DASH_TX.amount
    );
  });

  test('should support week period', async ({ request }) => {
    // E2E_TRANSACTION is 2026-02-10 → ISO week 7
    const response = await request.get(
      '/api/dashboard/summary?period=week&year=2026&week=7'
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.period).toBe('week');
    expect(body.year).toBe(2026);
    expect(body.week).toBe(7);
  });

  test('should return 400 for invalid query params', async ({ request }) => {
    const response = await request.get('/api/dashboard/summary?year=-1&month=13');

    expect(response.status()).toBe(400);
  });

  test('should return 400 for invalid period value', async ({ request }) => {
    const response = await request.get('/api/dashboard/summary?period=decade&year=2026');

    expect(response.status()).toBe(400);
  });
});

// ===========================================================================
// GET /api/dashboard/alerts
// ===========================================================================

test.describe('GET /api/dashboard/alerts', () => {
  test('should return alerts with over-budget category', async ({ request }) => {
    // E2E_DASH_BUDGET has amount=10, E2E_DASH_TX spent=50 → 500% → over_budget
    const response = await request.get('/api/dashboard/alerts?year=2026&month=2');

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(Array.isArray(body.alerts)).toBe(true);
    expect(body.hasOverBudget).toBe(true);

    // Find the dashboard category alert
    const dashAlert = body.alerts.find(
      (a: { categoryId: string }) => a.categoryId === E2E_DASH_CATEGORY.id
    );
    expect(dashAlert).toBeDefined();
    expect(dashAlert.type).toBe('over_budget');
    expect(dashAlert.budgetAmount).toBe(E2E_DASH_BUDGET.amount);
    expect(dashAlert.spentAmount).toBeGreaterThanOrEqual(E2E_DASH_TX.amount);
    expect(dashAlert.percentUsed).toBeGreaterThan(100);
    expect(typeof dashAlert.message).toBe('string');
    expect(dashAlert.overAmount).toBeGreaterThan(0);
  });

  test('should include alert structure fields', async ({ request }) => {
    const response = await request.get('/api/dashboard/alerts?year=2026&month=2');

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty('alerts');
    expect(body).toHaveProperty('hasWarnings');
    expect(body).toHaveProperty('hasOverBudget');
    expect(typeof body.hasWarnings).toBe('boolean');
    expect(typeof body.hasOverBudget).toBe('boolean');

    // At least one alert for over-budget dash category
    expect(body.alerts.length).toBeGreaterThanOrEqual(1);
    const alert = body.alerts[0];
    expect(alert).toHaveProperty('type');
    expect(alert).toHaveProperty('categoryId');
    expect(alert).toHaveProperty('categoryName');
    expect(alert).toHaveProperty('icon');
    expect(alert).toHaveProperty('budgetAmount');
    expect(alert).toHaveProperty('spentAmount');
    expect(alert).toHaveProperty('percentUsed');
    expect(alert).toHaveProperty('message');
  });

  test('should return empty alerts for month with no budgets', async ({ request }) => {
    const response = await request.get('/api/dashboard/alerts?year=2099&month=1');

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.alerts).toEqual([]);
    expect(body.hasWarnings).toBe(false);
    expect(body.hasOverBudget).toBe(false);
  });

  test('should not include on_track budgets in alerts', async ({ request }) => {
    const response = await request.get('/api/dashboard/alerts?year=2026&month=2');

    expect(response.status()).toBe(200);
    const body = await response.json();

    // E2E_BUDGET (food, 400) and E2E_BUDGET_2 (transport, 200) are well on_track
    // They should NOT appear in alerts
    const foodAlert = body.alerts.find(
      (a: { categoryId: string }) => a.categoryId === E2E_CATEGORY.id
    );
    const transportAlert = body.alerts.find(
      (a: { categoryId: string }) => a.categoryId === E2E_CATEGORY_2.id
    );
    expect(foodAlert).toBeUndefined();
    expect(transportAlert).toBeUndefined();
  });

  test('should return 400 for invalid query params', async ({ request }) => {
    const response = await request.get('/api/dashboard/alerts?year=-1&month=13');

    expect(response.status()).toBe(400);
  });
});
