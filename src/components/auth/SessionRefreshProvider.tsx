'use client';

import { useSessionRefresh } from '@/hooks/use-session-refresh';

/**
 * Client component that refreshes the JWT session periodically.
 * Renders nothing — purely a side-effect provider.
 */
export function SessionRefreshProvider() {
  useSessionRefresh();
  return null;
}
