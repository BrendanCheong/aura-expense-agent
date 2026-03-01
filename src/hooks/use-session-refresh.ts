'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

/**
 * Refresh interval — 25 minutes (5 minutes before the 30-minute JWT expires).
 * This ensures the session stays alive during active use.
 */
const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

/**
 * Periodically refreshes the JWT session cookie.
 * Should be mounted in a layout that wraps all authenticated pages.
 *
 * If the refresh fails (session expired or revoked), redirects to login.
 */
export function useSessionRefresh() {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function refresh() {
      try {
        await apiClient.post(API_ROUTES.AUTH_REFRESH);
      } catch {
        router.replace('/login?error=session_expired');
      }
    }

    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router]);
}
