'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAppwriteAccount } from '@/lib/appwrite/client';
import { Suspense } from 'react';

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
          const res = await fetch('/api/auth/dev-login', { method: 'POST' });
          if (!res.ok) throw new Error('Dev login failed');
          router.replace(redirect);
          return;
        }

        // Production — Appwrite handles OAuth callback automatically
        // by the time we reach this page, the session cookie is set.
        // We just need to ensure the user record exists in our DB.
        const account = getAppwriteAccount();
        const user = await account.get();

        // Ensure user record exists
        await fetch('/api/auth/ensure-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: user.$id,
            email: user.email,
            name: user.name,
            avatarUrl: user.prefs?.avatar ?? '',
          }),
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
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}
