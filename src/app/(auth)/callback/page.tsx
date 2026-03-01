'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState , Suspense } from 'react';

import { apiClient } from '@/lib/api-client';
import { getAppwriteAccount } from '@/lib/appwrite/client';
import { API_ROUTES } from '@/lib/constants';


function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const isDev = searchParams.get('dev') === 'true';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        if (isDev) {
          // Dev mode — call server-side API to register dev user
          await apiClient.post(API_ROUTES.AUTH_DEV_LOGIN);
          router.replace(redirect);
          return;
        }

        // Production — Appwrite handles OAuth callback automatically.
        // Get a temporary client JWT, then let the server handle everything:
        // create a long-lived JWT, set HttpOnly cookie, ensure user record.
        const account = getAppwriteAccount();
        const { jwt } = await account.createJWT();

        // Server creates the real session (HttpOnly cookie + ensure user)
        await apiClient.post(API_ROUTES.AUTH_SESSION, null, {
          headers: { Authorization: `Bearer ${jwt}` },
        });

        router.replace(redirect);
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Redirecting to login...');
        setTimeout(() => router.replace('/login?error=callback_failed'), 2000);
      }
    }

    handleCallback();
  }, [isDev, redirect, router]);

  return (
    <main className="aurora-bg relative flex min-h-screen items-center justify-center">
      <div className="relative z-10 text-center">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
            <p className="text-sm text-muted-foreground">Processing authentication...</p>
          </>
        )}
      </div>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}
    >
      <CallbackHandler />
    </Suspense>
  );
}
