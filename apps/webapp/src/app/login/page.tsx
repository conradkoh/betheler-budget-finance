'use client';

import { featureFlags } from '@workspace/backend/config/featureFlags';
import { AlertCircle, ChevronRight, KeyRound, KeySquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useGoogleAuthAvailable } from '@/modules/app/useAppInfo';
import { AnonymousLoginButton } from '@/modules/auth/AnonymousLoginButton';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { GoogleLoginButton } from '@/modules/auth/GoogleLoginButton';

/**
 * Component that handles search params with proper error handling
 */
function SearchParamsHandler() {
  const searchParams = useSearchParams();

  // Handle error messages from OAuth redirects
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(decodeURIComponent(error));
      // Clear the error from URL without causing a page reload
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  return null; // This component only handles side effects
}

/**
 * Login page component providing multiple authentication options.
 * Includes Google OAuth, code-based login, and anonymous access.
 */
function LoginPageContent() {
  const router = useRouter();
  const authState = useAuthState();
  const googleAuthAvailable = useGoogleAuthAvailable();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isLoading = authState === undefined;

  /**
   * Redirects authenticated users to the main application.
   */
  const redirectAuthenticated = useCallback(() => {
    router.push('/app');
  }, [router]);

  // Get session ID for anonymous login - moved to useEffect to avoid hydration mismatch
  useEffect(() => {
    setSessionId(localStorage.getItem('sessionId'));
  }, []);

  // Redirect authenticated users to app
  useEffect(() => {
    if (authState?.state === 'authenticated') {
      redirectAuthenticated();
    }
  }, [authState, redirectAuthenticated]);

  if (isLoading) {
    return _renderLoadingState();
  }

  // Show disabled state when login is disabled
  if (featureFlags.disableLogin) {
    return _renderDisabledState();
  }

  return _renderLoginForm(googleAuthAvailable, sessionId);
}

/**
 * Main login page component with Suspense boundary
 */
export default function LoginPage() {
  return (
    <Suspense fallback={_renderLoadingState()}>
      <SearchParamsHandler />
      <LoginPageContent />
    </Suspense>
  );
}

// 5. Internal helper functions
/**
 * Renders the loading state while checking authentication.
 */
function _renderLoadingState() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </main>
  );
}

/**
 * Renders the disabled state when login functionality is turned off.
 */
function _renderDisabledState() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground/60" />
              <h1 className="text-2xl font-semibold">Login Disabled</h1>
              <p className="text-muted-foreground">
                Login functionality has been disabled for this application.
              </p>
            </div>

            <div className="pt-4">
              <Link href="/">
                <Button variant="outline" className="w-full cursor-pointer">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Renders the main login form with authentication options.
 */
function _renderLoginForm(googleAuthAvailable: boolean | null, sessionId: string | null) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-md space-y-6">
        {_renderHeader()}
        {_renderLoginOptions(googleAuthAvailable, sessionId)}
        {_renderFooter()}
      </div>
    </main>
  );
}

/**
 * Renders the login page header.
 */
function _renderHeader() {
  return (
    <div className="text-center space-y-2">
      <h1 className="text-2xl font-bold">Welcome Back</h1>
      <p className="text-sm text-muted-foreground">Choose how you'd like to sign in</p>
    </div>
  );
}

/**
 * Renders the login options list with all available authentication methods.
 */
function _renderLoginOptions(googleAuthAvailable: boolean | null, sessionId: string | null) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="divide-y divide-border">
        {/* Google Login */}
        {googleAuthAvailable && <GoogleLoginButton variant="ghost" showChevron={true} />}

        {/* Login with Code */}
        {_renderCodeLoginOption()}

        {/* Anonymous Login */}
        {sessionId && <AnonymousLoginButton variant="list" />}
      </div>

      {/* Recovery Section */}
      {_renderRecoverySection()}
    </div>
  );
}

/**
 * Renders the login with code option.
 */
function _renderCodeLoginOption() {
  return (
    <Link href="/login/code" className="block no-underline">
      <div className="flex items-center justify-between h-16 px-6 hover:bg-muted/50 transition-colors cursor-pointer group">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8">
            <KeyRound className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-left">Enter Login Code</span>
            <span className="text-sm text-muted-foreground text-left">
              Use a code from your other device
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
}

/**
 * Renders the account recovery section.
 */
function _renderRecoverySection() {
  return (
    <div className="border-t border-border">
      <Link href="/recover" className="block">
        <div className="flex items-center justify-between h-14 px-6 hover:bg-muted/30 transition-colors cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8">
              <KeySquare className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Lost access to your account?
            </span>
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </Link>
    </div>
  );
}

/**
 * Renders the login page footer.
 */
function _renderFooter() {
  return (
    <div className="text-center text-xs text-muted-foreground">
      <p>By signing in, you agree to our terms of service</p>
    </div>
  );
}
