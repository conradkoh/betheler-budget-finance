'use client';

import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { useAuthState } from '@/modules/auth/AuthProvider';
import { LoginWithCode } from '@/modules/auth/LoginWithCode';

/**
 * Login code page that allows users to enter a code from another device for authentication.
 * Design: Matches the main login page aesthetic with clean card-based layout.
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
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Enter Login Code</h1>
          <p className="text-sm text-muted-foreground">
            Use a temporary code from your other device
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <LoginWithCode />
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to login options
          </Link>
        </div>
      </div>
    </main>
  );
}
