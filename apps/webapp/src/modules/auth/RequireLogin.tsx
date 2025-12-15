'use client';

import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import { UnauthorizedPage } from '@/components/UnauthorizedPage';
import { useAuthState } from '@/modules/auth/AuthProvider';

/**
 * Authentication guard component that requires user login to access protected content.
 * Shows loading state while checking authentication and unauthorized page for unauthenticated users.
 */
export const RequireLogin = ({ children }: { children: React.ReactNode }) => {
  const authState = useAuthState();

  const authStatus = useMemo(() => {
    if (!authState) return 'loading';
    if (authState.state === 'unauthenticated') return 'unauthorized';
    return 'authenticated';
  }, [authState]);

  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};
