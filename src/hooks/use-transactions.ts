'use client';

import { useState, useEffect, useCallback } from 'react';

import type { PaginatedResult, TransactionQueryOptions } from '@/lib/repositories/interfaces';
import type { Transaction, TransactionUpdate } from '@/types/transaction';

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
      const res = await fetch(`/api/transactions?${qs}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch transactions: ${res.status}`);
      }
      const data: PaginatedResult<Transaction> = await res.json();
      setTransactions(data.data);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to create transaction: ${res.status}`);
      }
      const created: Transaction = await res.json();
      // Re-fetch to get updated list in correct sort order
      await fetchTransactions();
      return created;
    },
    [fetchTransactions],
  );

  const updateTransaction = useCallback(
    async (id: string, data: TransactionUpdate): Promise<Transaction> => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to update transaction: ${res.status}`);
      }
      const updated: Transaction = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    [],
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete transaction: ${res.status}`);
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setTotal((prev) => prev - 1);
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
