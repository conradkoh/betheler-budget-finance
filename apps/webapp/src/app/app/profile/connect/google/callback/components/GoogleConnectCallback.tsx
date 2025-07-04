'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useAction } from 'convex/react';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthState } from '@/modules/auth/AuthProvider';

interface _OAuthValidationResult {
  isValid: boolean;
  error?: string;
}

interface _CSRFValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Google Connect Callback component for handling OAuth callback during account linking.
 * This component processes the OAuth callback and connects the Google account to the current user.
 */
export const GoogleConnectCallback = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authState = useAuthState();

  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convex functions
  const exchangeGoogleCode = useAction(api.googleAuth.exchangeGoogleCode);
  const connectGoogle = useSessionMutation(api.googleAuth.connectGoogle);

  /**
   * Processes the OAuth callback with comprehensive error handling.
   */
  const processCallback = useCallback(async () => {
    try {
      // Check if user is logged in
      if (authState?.state !== 'authenticated') {
        _handleError(
          'You must be logged in to connect a Google account',
          setError,
          setIsProcessing
        );
        return;
      }

      // Validate OAuth parameters
      const validation = _validateOAuthParameters(searchParams);
      if (!validation.isValid) {
        _handleError(validation.error || 'Validation failed', setError, setIsProcessing);
        return;
      }

      const code = searchParams.get('code');
      const state = searchParams.get('state');

      // These should be valid at this point due to validation above
      if (!code || !state) {
        _handleError('Missing required parameters after validation', setError, setIsProcessing);
        return;
      }

      // Validate CSRF state (more robust for React StrictMode)
      const stateValidation = await _validateCSRFStateRobust(state);
      if (!stateValidation.isValid) {
        // Check if this is a harmless duplicate execution
        if (
          stateValidation.error === 'OAuth callback already processed' ||
          stateValidation.error === 'Already processing'
        ) {
          // Silently ignore duplicate executions in React StrictMode
          setIsProcessing(false);
          return;
        }
        _handleError(
          stateValidation.error || 'Invalid state parameter - possible CSRF attack',
          setError,
          setIsProcessing
        );
        return;
      }

      // Exchange code for profile
      const redirectUri = `${window.location.origin}/app/profile/connect/google/callback`;
      const exchangeResult = await exchangeGoogleCode({
        code,
        state,
        redirectUri,
      });

      if (!exchangeResult.success || !exchangeResult.profile) {
        throw new Error('Failed to exchange code for profile');
      }

      // Connect Google profile to current user
      const connectResult = await connectGoogle({
        profile: exchangeResult.profile,
      });

      if (!connectResult.success) {
        throw new Error('Failed to connect Google account');
      }

      // Clean up session storage and mark as successfully processed
      sessionStorage.removeItem('google_oauth_connect_in_progress');
      sessionStorage.setItem('google_oauth_connect_processed', 'true');
      // Success!
      const successMessage = connectResult.converted
        ? 'Your anonymous account has been upgraded and Google account connected successfully!'
        : 'Google account connected successfully!';
      toast.success(successMessage);
      setIsProcessing(false); // Only set to false on success
      router.push('/app/profile');
    } catch (error) {
      // Handle specific error cases
      let errorMessage = 'Failed to connect Google account';

      if (error instanceof Error) {
        // Check for specific Convex error patterns
        if (error.message.includes('ALREADY_CONNECTED')) {
          errorMessage = 'This Google account is already connected to your account';
        } else if (error.message.includes('GOOGLE_ACCOUNT_IN_USE')) {
          errorMessage = 'This Google account is already connected to another user';
        } else if (error.message.includes('EMAIL_ALREADY_EXISTS')) {
          errorMessage =
            'Another user account already uses this email address. Please use a different Google account or contact support.';
        } else if (error.message.includes('INVALID_CONVERSION')) {
          errorMessage = 'Unable to convert your account. Please try again or contact support.';
        } else {
          errorMessage = error.message;
        }
      }

      _handleError(errorMessage, setError, setIsProcessing);
    }
  }, [searchParams, exchangeGoogleCode, connectGoogle, router, authState]);

  /**
   * Handles navigation back to profile page.
   */
  const handleReturnToProfile = useCallback(() => {
    router.push('/app/profile');
  }, [router]);

  // Process callback on mount
  useEffect(() => {
    processCallback();
  }, [processCallback]);

  // Show loading state while processing
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <CardTitle>Connecting Google Account</CardTitle>
            <CardDescription>
              Please wait while we link your Google account to your profile...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Connection Failed</CardTitle>
            <CardDescription>
              We encountered an issue while connecting your Google account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800 leading-relaxed">{error}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleReturnToProfile} className="w-full">
              Return to Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If not processing and no error, render nothing (redirect will happen on success)
  return null;
};

/**
 * Validates OAuth callback parameters for proper structure and error handling.
 */
function _validateOAuthParameters(searchParams: URLSearchParams): _OAuthValidationResult {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for OAuth errors first
  if (error) {
    const errorDescription = searchParams.get('error_description');
    return {
      isValid: false,
      error: `Google OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`,
    };
  }

  // Check for required parameters
  if (!code) {
    return {
      isValid: false,
      error: 'Missing authorization code from Google',
    };
  }

  if (!state) {
    return {
      isValid: false,
      error: 'Missing state parameter - possible security issue',
    };
  }

  return { isValid: true };
}

/**
 * Validates CSRF state parameter using simple comparison.
 */
async function _validateCSRFState(state: string): Promise<boolean> {
  try {
    const storedState = sessionStorage.getItem('google_oauth_connect_state');
    return storedState === state;
  } catch (_error) {
    return false;
  }
}

/**
 * Validates CSRF state parameter more robustly for React StrictMode.
 * Uses a processed flag to prevent double execution issues.
 */
async function _validateCSRFStateRobust(state: string): Promise<_CSRFValidationResult> {
  try {
    const storedState = sessionStorage.getItem('google_oauth_connect_state');
    const processedFlag = sessionStorage.getItem('google_oauth_connect_processed');
    const inProgressFlag = sessionStorage.getItem('google_oauth_connect_in_progress');

    // If already processed, don't process again (React StrictMode protection)
    if (processedFlag === 'true') {
      return { isValid: false, error: 'OAuth callback already processed' };
    }

    // If currently in progress, don't start another one
    if (inProgressFlag === 'true') {
      return { isValid: false, error: 'Already processing' };
    }

    if (storedState === state) {
      // Mark as in progress first to prevent concurrent processing
      sessionStorage.setItem('google_oauth_connect_in_progress', 'true');
      // Clean up the state after successful validation
      sessionStorage.removeItem('google_oauth_connect_state');
      return { isValid: true };
    }

    return { isValid: false, error: 'Invalid CSRF state' };
  } catch (_error) {
    return { isValid: false, error: 'Failed to validate CSRF state' };
  }
}

/**
 * Handles errors by setting error state and stopping processing.
 */
function _handleError(
  message: string,
  setError: (error: string) => void,
  setIsProcessing: (processing: boolean) => void
): void {
  // Clean up all session storage flags
  sessionStorage.removeItem('google_oauth_connect_state');
  sessionStorage.removeItem('google_oauth_connect_processed');
  sessionStorage.removeItem('google_oauth_connect_in_progress');

  // Stop processing and set error state
  setIsProcessing(false);
  setError(message);
}
