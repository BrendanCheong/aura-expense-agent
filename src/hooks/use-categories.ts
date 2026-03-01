'use client';

import { isAxiosError } from 'axios';
import { useState, useEffect, useCallback } from 'react';

import type { Category, CategoryUpdate } from '@/types/category';

import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

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
      const { data } = await apiClient.get<Category[]>(API_ROUTES.CATEGORIES);
      setCategories(data);
    } catch (err) {
      const message =
        isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Unknown error';
      setError(message);
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
      try {
        const { data: created } = await apiClient.post<Category>(API_ROUTES.CATEGORIES, data);
        setCategories((prev) => [...prev, created]);
        return created;
      } catch (err) {
        const message =
          isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Failed to create category';
        throw new Error(message);
      }
    },
    []
  );

  const updateCategory = useCallback(
    async (id: string, data: CategoryUpdate): Promise<Category> => {
      try {
        const { data: updated } = await apiClient.patch<Category>(API_ROUTES.CATEGORY(id), data);
        setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
        return updated;
      } catch (err) {
        const message =
          isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Failed to update category';
        throw new Error(message);
      }
    },
    []
  );

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(API_ROUTES.CATEGORY(id));
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const message =
        isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Failed to delete category';
      throw new Error(message);
    }
  }, []);

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
