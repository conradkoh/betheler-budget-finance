'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useAction } from 'convex/react';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface GoogleCallbackProps {
  redirectPath?: string;
}

interface _ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Google OAuth callback component that handles the authorization code exchange.
 * Processes the callback from Google and completes the authentication flow.
 */
export const GoogleCallback = ({ redirectPath = '/app' }: GoogleCallbackProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  const exchangeGoogleCode = useAction(api.googleAuth.exchangeGoogleCode);
  const loginWithGoogle = useSessionMutation(api.googleAuth.loginWithGoogle);

  // Check for immediate errors (like cancellation) and redirect without showing loading
  const hasError = searchParams.get('error');

  /**
   * Processes the OAuth callback with comprehensive error handling.
   */
  const processCallback = useCallback(async () => {
    try {
      // Validate OAuth parameters
      const validation = _validateOAuthParameters(searchParams);
      if (!validation.isValid) {
        _handleError(validation.error || 'Validation failed', router);
        return;
      }

      const code = searchParams.get('code');
      const state = searchParams.get('state');

      // These should be valid at this point due to validation above
      if (!code || !state) {
        _handleError('Missing required parameters after validation', router);
        return;
      }

      // Validate CSRF state
      const isStateValid = await _validateCSRFState(state);
      if (!isStateValid) {
        _handleError('Invalid state parameter - possible CSRF attack', router);
        return;
      }

      // Clean up stored state
      sessionStorage.removeItem('google_oauth_state');

      console.log('Starting Google OAuth token exchange...');
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

      console.log('Token exchange successful, logging in with Google profile...');
      // Login with Google profile
      const loginResult = await loginWithGoogle({
        profile: exchangeResult.profile,
      });

      if (!loginResult.success) {
        throw new Error('Failed to complete Google login');
      }

      console.log('Google login successful, redirecting...');
      // Success!
      toast.success(`Welcome, ${exchangeResult.profile.name}!`);
      setIsProcessing(false); // Only set to false on success
      router.push(redirectPath);
    } catch (error) {
      console.error('Google callback error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      _handleError(errorMessage, router);
    }
  }, [searchParams, exchangeGoogleCode, loginWithGoogle, router, redirectPath]);

  // Handle errors immediately
  useEffect(() => {
    if (hasError) {
      const error = searchParams.get('error');
      if (error === 'access_denied') {
        console.error('OAuth cancelled by user');
      } else {
        console.error('OAuth error:', error, searchParams.get('error_description'));
      }
      router.push('/login');
    }
  }, [hasError, router, searchParams]);

  // Process callback on mount (only if no error)
  useEffect(() => {
    if (!hasError) {
      // Add a small delay before processing to ensure the component is fully mounted
      // This helps prevent race conditions with sessionStorage access
      const timer = setTimeout(() => {
        processCallback();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [hasError, processCallback]);

  // Return null for errors to avoid any flash of loading content
  if (hasError) {
    return null;
  }

  return _renderLoadingState(isProcessing);
};

/**
 * Validates OAuth parameters from the callback URL.
 */
function _validateOAuthParameters(searchParams: URLSearchParams): _ValidationResult {
  const error = searchParams.get('error');

  // Handle OAuth error
  if (error) {
    console.error('Google OAuth error:', error);

    // Provide user-friendly error messages for common scenarios
    if (error === 'access_denied') {
      return {
        isValid: false,
        error: 'Google sign-in was cancelled. Please try again if you want to continue.',
      };
    }

    const errorDescription =
      searchParams.get('error_description') || 'Google authentication failed';
    return { isValid: false, error: errorDescription };
  }

  // Validate required parameters
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return { isValid: false, error: 'Missing required OAuth parameters' };
  }

  return { isValid: true };
}

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
 * Handles errors by immediately redirecting to login.
 */
function _handleError(errorMessage: string, router: ReturnType<typeof useRouter>): void {
  console.error('OAuth error:', errorMessage);
  // Immediately redirect - no toast needed since user won't see it
  router.push('/login');
}

/**
 * Renders the loading state UI during authentication processing.
 */
function _renderLoadingState(isProcessing: boolean) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">Completing Sign In</h1>
            <p className="text-gray-600">
              {isProcessing
                ? 'Please wait while we complete your Google authentication...'
                : 'Authentication complete!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
