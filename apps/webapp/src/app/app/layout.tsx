'use client';

import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

import { AuthErrorBoundary } from '@/modules/auth/AuthErrorBoundary';
import { RequireLogin } from '@/modules/auth/RequireLogin';

/**
 * Loading fallback for Suspense boundary.
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Authenticated application layout.
 *
 * This layout provides a layered authentication system:
 * 1. RequireLogin - Primary auth gate, shows UnauthorizedPage if not logged in
 * 2. AuthErrorBoundary - Catches stale session errors and redirects to login
 * 3. Suspense - Provides loading state while content loads
 *
 * The AuthErrorBoundary handles edge cases where the frontend auth state
 * is stale (says authenticated) but the backend rejects the session.
 * Instead of crashing, users are gracefully redirected to login.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireLogin>
      <AuthErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
      </AuthErrorBoundary>
    </RequireLogin>
  );
}
