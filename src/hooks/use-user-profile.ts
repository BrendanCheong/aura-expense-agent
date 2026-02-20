'use client';

import { useState, useEffect, useCallback } from 'react';

import type { User, UserUpdate } from '@/types/user';

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
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }
      const data: { user: User } = await res.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (data: UserUpdate): Promise<void> => {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to update profile: ${res.status}`);
      }
      const updated: { user: User } = await res.json();
      setUser(updated.user);
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
