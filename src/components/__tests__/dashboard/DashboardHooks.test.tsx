/**
 * MSW integration tests — Dashboard hooks.
 *
 * Tests useDashboard hook against mocked HTTP endpoints.
 *
 * @vitest-environment jsdom
 */

import { cleanup, renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DashboardAlertsResponse, DashboardSummaryResponse } from '@/types/dashboard';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SUMMARY: DashboardSummaryResponse = {
  period: 'month',
  year: 2026,
  month: 2,
  summary: {
    totalSpent: 650.49,
    totalBudget: 1900,
    transactionCount: 16,
    averageTransaction: 40.66,
  },
  byCategory: [
    {
      categoryId: 'cat-food',
      categoryName: 'Food & Beverage',
      icon: '🍔',
      color: '#ef4444',
      spent: 188.3,
      budget: 400,
      percentage: 18.4,
      transactionCount: 7,
    },
    {
      categoryId: 'cat-transport',
      categoryName: 'Transportation',
      icon: '🚗',
      color: '#f97316',
      spent: 135,
      budget: 150,
      percentage: 13.2,
      transactionCount: 5,
    },
    {
      categoryId: 'cat-shopping',
      categoryName: 'Shopping',
      icon: '🛍️',
      color: '#a855f7',
      spent: 327.19,
      budget: 300,
      percentage: 31.9,
      transactionCount: 4,
    },
  ],
  recentTransactions: [
    {
      id: 'tx-001',
      vendor: 'GRAB *GRABFOOD',
      amount: 18.5,
      categoryName: 'Food & Beverage',
      categoryIcon: '🍔',
      transactionDate: '2026-02-08T12:30:00+08:00',
      confidence: 'high',
    },
    {
      id: 'tx-002',
      vendor: 'MRT TOP-UP',
      amount: 20.0,
      categoryName: 'Transportation',
      categoryIcon: '🚗',
      transactionDate: '2026-02-07T08:15:00+08:00',
      confidence: 'medium',
    },
  ],
  dailySpending: [
    { date: '2026-02-01', amount: 54.48 },
    { date: '2026-02-02', amount: 5.8 },
  ],
};

const MOCK_ALERTS: DashboardAlertsResponse = {
  alerts: [
    {
      type: 'over_budget',
      categoryId: 'cat-shopping',
      categoryName: 'Shopping',
      icon: '🛍️',
      budgetAmount: 300,
      spentAmount: 327.19,
      percentUsed: 109.06,
      overAmount: 27.19,
      message: 'Shopping is $27.19 over your $300.00 budget',
    },
    {
      type: 'warning',
      categoryId: 'cat-transport',
      categoryName: 'Transportation',
      icon: '🚗',
      budgetAmount: 150,
      spentAmount: 135,
      percentUsed: 90,
      message: 'Transportation spending is at 90% of your $150.00 budget',
    },
  ],
  hasWarnings: true,
  hasOverBudget: true,
};

// ---------------------------------------------------------------------------
// MSW Server
// ---------------------------------------------------------------------------

const handlers = [
  http.get('/api/dashboard/summary', ({ request }) => {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month';
    return HttpResponse.json({ ...MOCK_SUMMARY, period });
  }),

  http.get('/api/dashboard/alerts', () => {
    return HttpResponse.json(MOCK_ALERTS);
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
// useDashboard
// ===========================================================================

describe('useDashboard (MSW)', () => {
  let useDashboard: typeof import('@/hooks/use-dashboard').useDashboard;

  beforeEach(async () => {
    vi.resetModules();
    ({ useDashboard } = await import('@/hooks/use-dashboard'));
  });

  it('fetches summary and alerts on mount', async () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.summary).toBeTruthy();
    expect(result.current.summary!.summary.totalSpent).toBeCloseTo(650.49);
    expect(result.current.alerts).toBeTruthy();
    expect(result.current.alerts!.alerts).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('returns category breakdown from summary', async () => {
    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.summary!.byCategory).toHaveLength(3);
    expect(result.current.summary!.byCategory[0].categoryId).toBe('cat-food');
  });

  it('re-fetches when period changes', async () => {
    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPeriod('week');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.summary!.period).toBe('week');
    });
  });

  it('handles API error gracefully', async () => {
    server.use(
      http.get('/api/dashboard/summary', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.summary).toBeNull();
  });

  it('filters recent transactions when selectedCategory is set', async () => {
    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // All transactions initially
    expect(result.current.filteredTransactions).toHaveLength(2);

    act(() => {
      result.current.setSelectedCategory('Food & Beverage');
    });

    // Only Food & Beverage transactions
    expect(result.current.filteredTransactions).toHaveLength(1);
    expect(result.current.filteredTransactions[0].vendor).toBe('GRAB *GRABFOOD');
  });

  it('clears category filter when set to null', async () => {
    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSelectedCategory('Food & Beverage');
    });
    expect(result.current.filteredTransactions).toHaveLength(1);

    act(() => {
      result.current.setSelectedCategory(null);
    });
    expect(result.current.filteredTransactions).toHaveLength(2);
  });

  it('defaults to month period', async () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.period).toBe('month');

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.summary!.period).toBe('month');
  });
});
