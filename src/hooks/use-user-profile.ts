'use client';

import { isAxiosError } from 'axios';
import { useState, useEffect, useCallback } from 'react';

import type { User, UserUpdate } from '@/types/user';

import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

interface UseUserProfileReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: UserUpdate) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<{ user: User }>(API_ROUTES.USER_PROFILE);
      setUser(data.user);
    } catch (err) {
      const message =
        isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (data: UserUpdate): Promise<void> => {
      try {
        const { data: updated } = await apiClient.patch<{ user: User }>(API_ROUTES.USER_PROFILE, data);
        setUser(updated.user);
      } catch (err) {
        const message =
          isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Failed to update profile';
        throw new Error(message);
      }
    },
    [],
  );

  return {
    user,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}
