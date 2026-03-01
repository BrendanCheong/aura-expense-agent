'use client';

import { isAxiosError } from 'axios';
import { useState, useEffect, useCallback } from 'react';

import type { BudgetsWithSpending } from '@/types/budget';

import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

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
      const { data } = await apiClient.get<BudgetsWithSpending>(`${API_ROUTES.BUDGETS}?${params.toString()}`);
      setBudgetsWithSpending(data);
    } catch (err) {
      const message =
        isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Unknown error';
      setError(message);
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
      try {
        await apiClient.put(API_ROUTES.BUDGETS, { categoryId, amount, year, month });
        // Re-fetch to get updated spending data
        await fetchBudgets();
      } catch (err) {
        const message =
          isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Failed to upsert budget';
        throw new Error(message);
      }
    },
    [year, month, fetchBudgets],
  );

  const deleteBudget = useCallback(
    async (budgetId: string): Promise<void> => {
      try {
        await apiClient.delete(API_ROUTES.BUDGET(budgetId));
        await fetchBudgets();
      } catch (err) {
        const message =
          isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Failed to delete budget';
        throw new Error(message);
      }
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
