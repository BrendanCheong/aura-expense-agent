/**
 * MSW integration tests — Budget hooks.
 *
 * Tests useBudgets and useUserProfile hooks against mocked HTTP endpoints.
 *
 * @vitest-environment jsdom
 */

import { cleanup, renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BudgetsWithSpending } from '@/types/budget';
import type { User } from '@/types/user';

import { BudgetMode } from '@/lib/enums';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_BUDGETS_RESPONSE: BudgetsWithSpending = {
  year: 2026,
  month: 2,
  budgets: [
    {
      id: 'budget-001',
      categoryId: 'cat-food',
      budgetAmount: 400,
      spentAmount: 188.3,
      remainingAmount: 211.7,
      percentUsed: 47.08,
      status: 'on_track',
      year: 2026,
      month: 2,
    },
  ],
  totalBudget: 400,
  totalSpent: 188.3,
  totalRemaining: 211.7,
};

const MOCK_USER: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: '',
  inboundEmail: 'test@inbound.aura.local',
  oauthProvider: 'google' as User['oauthProvider'],
  monthlySalary: 5000,
  budgetMode: BudgetMode.DIRECT,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// MSW Server
// ---------------------------------------------------------------------------

const handlers = [
  http.get('/api/budgets', () => {
    return HttpResponse.json(MOCK_BUDGETS_RESPONSE);
  }),

  http.put('/api/budgets', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      id: 'budget-new',
      userId: 'user-1',
      categoryId: body.categoryId,
      amount: body.amount,
      year: body.year,
      month: body.month,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
  }),

  http.delete('/api/budgets/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/user/profile', () => {
    return HttpResponse.json({ user: MOCK_USER });
  }),

  http.patch('/api/user/profile', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      user: { ...MOCK_USER, ...body, updatedAt: new Date().toISOString() },
    });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.restoreAllMocks();
});

afterAll(() => {
  server.close();
});

// ===========================================================================
// useBudgets
// ===========================================================================

describe('useBudgets (MSW)', () => {
  let useBudgets: typeof import('@/hooks/use-budgets').useBudgets;

  beforeEach(async () => {
    vi.resetModules();
    ({ useBudgets } = await import('@/hooks/use-budgets'));
  });

  it('fetches budgets on mount', async () => {
    const { result } = renderHook(() => useBudgets());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.budgetsWithSpending).toEqual(MOCK_BUDGETS_RESPONSE);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useBudgets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.budgetsWithSpending).toBeNull();
  });

  it('upserts a budget and refetches', async () => {
    const { result } = renderHook(() => useBudgets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.upsertBudget('cat-food', 500);
    });

    // After upsert, refetch is triggered — data should still be present
    await waitFor(() => {
      expect(result.current.budgetsWithSpending).toBeTruthy();
    });
  });

  it('deletes a budget and refetches', async () => {
    const { result } = renderHook(() => useBudgets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteBudget('budget-001');
    });

    await waitFor(() => {
      expect(result.current.budgetsWithSpending).toBeTruthy();
    });
  });

  it('changes month and refetches', async () => {
    const { result } = renderHook(() => useBudgets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setMonth(2026, 3);
    });

    // Should trigger a new fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.budgetsWithSpending).toBeTruthy();
    });
  });
});

// ===========================================================================
// useUserProfile
// ===========================================================================

describe('useUserProfile (MSW)', () => {
  let useUserProfile: typeof import('@/hooks/use-user-profile').useUserProfile;

  beforeEach(async () => {
    vi.resetModules();
    ({ useUserProfile } = await import('@/hooks/use-user-profile'));
  });

  it('fetches user profile on mount', async () => {
    const { result } = renderHook(() => useUserProfile());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(MOCK_USER);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    server.use(
      http.get('/api/user/profile', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.user).toBeNull();
  });

  it('updates profile and reflects changes', async () => {
    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateProfile({ monthlySalary: 6000 });
    });

    await waitFor(() => {
      expect(result.current.user?.monthlySalary).toBe(6000);
    });
  });

  it('updates budget mode', async () => {
    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateProfile({ budgetMode: BudgetMode.PERCENTAGE });
    });

    await waitFor(() => {
      expect(result.current.user?.budgetMode).toBe(BudgetMode.PERCENTAGE);
    });
  });
});
