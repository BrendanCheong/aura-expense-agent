'use client';

import { isAxiosError } from 'axios';
import { useState, useEffect, useCallback } from 'react';

import type { PaginatedResult, TransactionQueryOptions } from '@/lib/repositories/interfaces';
import type { Transaction, TransactionUpdate } from '@/types/transaction';

import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

interface UseTransactionsReturn {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setFilters: (filters: Partial<TransactionQueryOptions>) => void;
  createTransaction: (data: {
    amount: number;
    vendor: string;
    categoryId: string;
    transactionDate: string;
    description?: string;
  }) => Promise<Transaction>;
  updateTransaction: (id: string, data: TransactionUpdate) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
}

const DEFAULT_FILTERS: TransactionQueryOptions = {
  page: 1,
  limit: 20,
  sortBy: 'transactionDate',
  sortOrder: 'desc',
};

function buildQueryString(filters: TransactionQueryOptions): string {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  if (filters.sortBy) {params.set('sortBy', filters.sortBy);}
  if (filters.sortOrder) {params.set('sortOrder', filters.sortOrder);}
  if (filters.startDate) {params.set('startDate', filters.startDate);}
  if (filters.endDate) {params.set('endDate', filters.endDate);}
  if (filters.categoryId) {params.set('categoryId', filters.categoryId);}
  if (filters.source) {params.set('source', filters.source);}
  return params.toString();
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TransactionQueryOptions>(DEFAULT_FILTERS);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = buildQueryString(filters);
      const { data } = await apiClient.get<PaginatedResult<Transaction>>(`${API_ROUTES.TRANSACTIONS}?${qs}`);
      setTransactions(data.data);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
      setHasMore(data.hasMore);
    } catch (err) {
      const message =
        isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const setFilters = useCallback((newFilters: Partial<TransactionQueryOptions>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (unless page is explicitly set)
      page: newFilters.page ?? 1,
    }));
  }, []);

  const createTransaction = useCallback(
    async (data: {
      amount: number;
      vendor: string;
      categoryId: string;
      transactionDate: string;
      description?: string;
    }): Promise<Transaction> => {
      try {
        const { data: created } = await apiClient.post<Transaction>(API_ROUTES.TRANSACTIONS, data);
        // Re-fetch to get updated list in correct sort order
        await fetchTransactions();
        return created;
      } catch (err) {
        const message =
          isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Failed to create transaction';
        throw new Error(message);
      }
    },
    [fetchTransactions],
  );

  const updateTransaction = useCallback(
    async (id: string, data: TransactionUpdate): Promise<Transaction> => {
      try {
        const { data: updated } = await apiClient.patch<Transaction>(API_ROUTES.TRANSACTION(id), data);
        setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      } catch (err) {
        const message =
          isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Failed to update transaction';
        throw new Error(message);
      }
    },
    [],
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      try {
        await apiClient.delete(API_ROUTES.TRANSACTION(id));
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        setTotal((prev) => prev - 1);
      } catch (err) {
        const message =
          isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Failed to delete transaction';
        throw new Error(message);
      }
    },
    [],
  );

  return {
    transactions,
    total,
    page,
    limit,
    hasMore,
    isLoading,
    error,
    refetch: fetchTransactions,
    setFilters,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
