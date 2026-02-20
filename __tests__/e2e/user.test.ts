/**
 * E2E tests — User Profile API endpoints.
 *
 * API-only tests (no browser). Runs against the real dev server with
 * PROJECT_ENV=dev for auth bypass (returns dev-user-001).
 *
 * Pattern: Prepare → Act → Assert
 */

import { test, expect } from '@playwright/test';

const API_BASE = '/api/user/profile';

// ---------------------------------------------------------------------------
// GET /api/user/profile
// ---------------------------------------------------------------------------

test.describe('GET /api/user/profile', () => {
  test('should return the authenticated user profile', async ({ request }) => {
    const response = await request.get(API_BASE);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user).toBeDefined();
    expect(body.user.accountId).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/user/profile
// ---------------------------------------------------------------------------

test.describe('PATCH /api/user/profile', () => {
  test('should update monthly salary', async ({ request }) => {
    const response = await request.patch(API_BASE, {
      data: { monthlySalary: 5000 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user).toBeDefined();
    expect(body.user.monthlySalary).toBe(5000);
  });

  test('should update budget mode', async ({ request }) => {
    const response = await request.patch(API_BASE, {
      data: { budgetMode: 'percentage' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user.budgetMode).toBe('percentage');
  });

  test('should update both salary and budget mode', async ({ request }) => {
    const response = await request.patch(API_BASE, {
      data: { monthlySalary: 8000, budgetMode: 'direct' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user.monthlySalary).toBe(8000);
    expect(body.user.budgetMode).toBe('direct');
  });

  test('should return 400 for empty body', async ({ request }) => {
    const response = await request.patch(API_BASE, {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test('should return 400 for invalid budget mode', async ({ request }) => {
    const response = await request.patch(API_BASE, {
      data: { budgetMode: 'invalid_mode' },
    });

    expect(response.status()).toBe(400);
  });

  test('should return 400 for negative salary', async ({ request }) => {
    const response = await request.patch(API_BASE, {
      data: { monthlySalary: -100 },
    });

    expect(response.status()).toBe(400);
  });
});
