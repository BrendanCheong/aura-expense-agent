'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Category, CategoryUpdate } from '@/types/category';

interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCategory: (data: {
    name: string;
    description: string;
    icon?: string;
    color?: string;
  }) => Promise<Category>;
  updateCategory: (id: string, data: CategoryUpdate) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) {
        throw new Error(`Failed to fetch categories: ${res.status}`);
      }
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createCategory = useCallback(
    async (data: {
      name: string;
      description: string;
      icon?: string;
      color?: string;
    }): Promise<Category> => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to create category: ${res.status}`);
      }
      const created: Category = await res.json();
      setCategories((prev) => [...prev, created]);
      return created;
    },
    [],
  );

  const updateCategory = useCallback(
    async (id: string, data: CategoryUpdate): Promise<Category> => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to update category: ${res.status}`);
      }
      const updated: Category = await res.json();
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c)),
      );
      return updated;
    },
    [],
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete category: ${res.status}`);
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    },
    [],
  );

  return {
    categories,
    isLoading,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
