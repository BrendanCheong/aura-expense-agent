'use client';

import { useState, useEffect, useCallback } from 'react';

import type { BudgetsWithSpending } from '@/types/budget';

interface UseBudgetsReturn {
  budgetsWithSpending: BudgetsWithSpending | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  upsertBudget: (categoryId: string, amount: number) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  setMonth: (year: number, month: number) => void;
}

export function useBudgets(): UseBudgetsReturn {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonthState] = useState(now.getMonth() + 1);
  const [budgetsWithSpending, setBudgetsWithSpending] = useState<BudgetsWithSpending | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ year: String(year), month: String(month) });
      const res = await fetch(`/api/budgets?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch budgets: ${res.status}`);
      }
      const data: BudgetsWithSpending = await res.json();
      setBudgetsWithSpending(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void fetchBudgets();
  }, [fetchBudgets]);

  const setMonth = useCallback((newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonthState(newMonth);
  }, []);

  const upsertBudget = useCallback(
    async (categoryId: string, amount: number): Promise<void> => {
      const res = await fetch('/api/budgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, amount, year, month }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to upsert budget: ${res.status}`);
      }
      // Re-fetch to get updated spending data
      await fetchBudgets();
    },
    [year, month, fetchBudgets],
  );

  const deleteBudget = useCallback(
    async (budgetId: string): Promise<void> => {
      const res = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete budget: ${res.status}`);
      }
      await fetchBudgets();
    },
    [fetchBudgets],
  );

  return {
    budgetsWithSpending,
    isLoading,
    error,
    refetch: fetchBudgets,
    upsertBudget,
    deleteBudget,
    setMonth,
  };
}
