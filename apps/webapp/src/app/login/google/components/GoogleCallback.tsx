'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useAction } from 'convex/react';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface GoogleCallbackProps {
  code: string;
  state: string;
  redirectPath?: string;
}

/**
 * Google OAuth callback component that handles the authorization code exchange.
 * Processes the callback from Google and completes the authentication flow.
 * Parameters are passed as props to eliminate useEffect and React StrictMode issues.
 */
export const GoogleCallback = ({ code, state, redirectPath = '/app' }: GoogleCallbackProps) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false);

  const exchangeGoogleCode = useAction(api.auth.google.exchangeGoogleCode);
  const loginWithGoogle = useSessionMutation(api.auth.google.loginWithGoogle);

  /**
   * Processes the OAuth callback with the provided parameters.
   */
  const processCallback = useCallback(async () => {
    // Prevent double execution
    if (hasProcessed) {
      return;
    }

    try {
      setHasProcessed(true);

      // Validate CSRF state
      const isStateValid = await _validateCSRFState(state);
      if (!isStateValid) {
        router.push('/login');
        return;
      }

      // Clean up stored state
      sessionStorage.removeItem('google_oauth_state');

      // Exchange code for profile
      const redirectUri = `${window.location.origin}/login/google/callback`;
      const exchangeResult = await exchangeGoogleCode({
        code,
        state,
        redirectUri,
      });

      if (!exchangeResult.success || !exchangeResult.profile) {
        throw new Error('Failed to exchange code for profile');
      }

      // Login with Google profile
      const loginResult = await loginWithGoogle({
        profile: exchangeResult.profile,
      });

      if (!loginResult.success) {
        throw new Error('Failed to complete Google login');
      }

      // Success!
      toast.success(`Welcome, ${exchangeResult.profile.name}!`);
      setIsProcessing(false);
      router.push(redirectPath);
    } catch (error: unknown) {
      console.error('Google OAuth callback error:', error);
      router.push('/login');
    }
  }, [code, state, exchangeGoogleCode, loginWithGoogle, router, redirectPath, hasProcessed]);

  // Process callback on mount
  useEffect(() => {
    processCallback();
  }, [processCallback]);

  return _renderLoadingState(isProcessing);
};

/**
 * Validates CSRF state parameter with retry mechanism for timing issues.
 */
async function _validateCSRFState(state: string): Promise<boolean> {
  let storedState: string | null = null;
  let retryCount = 0;
  const maxRetries = 3;

  // Retry sessionStorage access to handle potential timing issues
  while (retryCount < maxRetries) {
    storedState = sessionStorage.getItem('google_oauth_state');
    if (storedState) {
      break;
    }
    // Wait a bit before retrying (only if we don't have the state yet)
    if (retryCount < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    retryCount++;
  }

  return storedState !== null && storedState === state;
}

/**
 * Renders the loading state while processing OAuth callback.
 */
function _renderLoadingState(isProcessing: boolean) {
  if (!isProcessing) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Authenticating...</h1>
            <p className="text-muted-foreground">Completing your Google sign-in...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
