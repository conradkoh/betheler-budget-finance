'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Component, type ReactNode, useEffect, useState } from 'react';

/**
 * Props for the AuthErrorBoundary component.
 */
interface AuthErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback to show while redirecting */
  fallback?: ReactNode;
}

/**
 * State for the AuthErrorBoundary.
 */
interface AuthErrorBoundaryState {
  hasAuthError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches authentication errors from Convex queries.
 *
 * When a query throws "User not authenticated" or similar auth errors,
 * this boundary catches it and triggers a redirect to the login page
 * instead of crashing the UI.
 *
 * This enables optimistic query execution - queries can fire immediately
 * assuming the session is valid, and if it's not, users are gracefully
 * redirected to login.
 *
 * @example
 * ```tsx
 * <AuthErrorBoundary>
 *   <Suspense fallback={<Loading />}>
 *     <AuthenticatedContent />
 *   </Suspense>
 * </AuthErrorBoundary>
 * ```
 */
class AuthErrorBoundaryClass extends Component<
  AuthErrorBoundaryProps & { onAuthError: () => void },
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps & { onAuthError: () => void }) {
    super(props);
    this.state = { hasAuthError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // Check if this is an authentication error from Convex
    const isAuthError =
      error.message.includes('User not authenticated') ||
      error.message.includes('Session not found') ||
      error.message.includes('not authenticated');

    if (isAuthError) {
      return { hasAuthError: true, error };
    }

    // Re-throw non-auth errors to be handled by other error boundaries
    throw error;
  }

  componentDidCatch(_error: Error) {
    if (this.state.hasAuthError) {
      // Trigger redirect via the callback
      this.props.onAuthError();
    }
  }

  render() {
    if (this.state.hasAuthError) {
      // Show fallback while redirecting
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Session expired. Redirecting to login...
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component that provides redirect functionality to the error boundary.
 */
export function AuthErrorBoundary({ children, fallback }: AuthErrorBoundaryProps) {
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (shouldRedirect) {
      router.replace('/login');
    }
  }, [shouldRedirect, router]);

  const handleAuthError = () => {
    setShouldRedirect(true);
  };

  return (
    <AuthErrorBoundaryClass fallback={fallback} onAuthError={handleAuthError}>
      {children}
    </AuthErrorBoundaryClass>
  );
}
