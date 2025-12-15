'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { LoginWithCode } from '@/modules/auth/LoginWithCode';

/**
 * Login code page that allows users to enter a code from another device for authentication.
 * Redirects authenticated users and provides a clean interface for code-based login.
 */
export default function LoginCodePage() {
  const router = useRouter();
  const authState = useAuthState();
  const isLoading = authState === undefined;

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => {
    return authState?.state === 'authenticated';
  }, [authState]);

  // Redirect to app if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/app');
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen p-4">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Login with Code</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the code from your other device to access your account
          </p>
        </div>

        <div className="mt-6">
          <LoginWithCode />
        </div>

        <div className="mt-6 text-center">
          <Link href="/login">
            <Button variant="ghost" size="sm" aria-label="Return to login page">
              Back to Login
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
