// 1. Imports (external first, then internal)
import { api } from '@workspace/backend/convex/_generated/api';
import { fetchAction } from 'convex/nextjs';
import { Suspense } from 'react';

import { CallbackErrorCard } from '@/components/CallbackErrorCard';
import { CallbackSuccessCard } from '@/components/CallbackSuccessCard';

// 2. Public interfaces and types
export interface GoogleOAuthCallbackPageProps {
  searchParams: Promise<{
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }>;
}

export interface CallbackResult {
  success: boolean;
  flowType?: 'login' | 'connect';
  error?: string;
  userName?: string;
}

// 3. Internal interfaces and types (prefixed with _)
// None needed for this file

// 4. Main exported functions/components
/**
 * Unified Google OAuth callback page that processes the OAuth response server-side
 * and displays appropriate UI based on success or failure. This replaces the API route
 * approach for better user experience with proper error handling and UI.
 */
export default async function GoogleOAuthCallbackPage({
  searchParams,
}: GoogleOAuthCallbackPageProps) {
  const params = await searchParams;

  // Handle OAuth errors from Google directly
  if (params.error) {
    console.error('OAuth error from Google:', params.error, params.error_description);

    const userFriendlyError = _getUserFriendlyError(params.error, params.error_description);

    return <CallbackErrorCard error={userFriendlyError} flowType="login" />;
  }

  // Validate required parameters
  if (!params.code || !params.state) {
    console.error('Missing OAuth parameters:', { code: !!params.code, state: !!params.state });

    return (
      <CallbackErrorCard
        error="Missing required OAuth parameters. Please start the authentication process again."
        flowType="login"
      />
    );
  }

  // Process the OAuth callback server-side
  let callbackResult: CallbackResult;

  try {
    const result = await fetchAction(api.auth.google.handleGoogleCallback, {
      code: params.code,
      state: params.state,
    });

    if (result.success) {
      // Log successful authentication for monitoring
      console.info('OAuth callback successful', {
        flowType: result.flowType,
        timestamp: Date.now(),
      });

      callbackResult = {
        success: true,
        flowType: result.flowType,
        // Note: We don't have userName from the callback result currently
        // This could be enhanced in the future if needed
      };
    } else {
      // Handle Convex action failure
      console.error('OAuth callback failed:', result.error);

      callbackResult = {
        success: false,
        flowType: result.flowType,
        error: result.error,
      };
    }
  } catch (error) {
    // Handle internal server error
    console.error('Internal server error during OAuth callback:', error);

    callbackResult = {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error occurred during authentication',
    };
  }

  // Return appropriate UI based on result
  if (callbackResult.success) {
    return (
      <Suspense fallback={<LoadingState />}>
        <CallbackSuccessCard
          flowType={callbackResult.flowType}
          userName={callbackResult.userName}
          autoCloseDelay={3}
        />
      </Suspense>
    );
  }

  // Handle failure case
  return (
    <CallbackErrorCard
      error={callbackResult.error || 'Authentication failed'}
      flowType={callbackResult.flowType || 'login'}
    />
  );
}

// 5. Internal helper functions (at bottom)
/**
 * Creates user-friendly error messages from OAuth error codes and descriptions.
 */
function _getUserFriendlyError(errorCode: string, errorDescription?: string): string {
  const lowerError = errorCode.toLowerCase();
  const lowerDescription = errorDescription?.toLowerCase() || '';

  if (lowerError.includes('access_denied')) {
    return 'You cancelled the authentication process.';
  }

  if (lowerError.includes('expired')) {
    return 'The authentication request has expired. Please try again.';
  }

  if (lowerError.includes('invalid') || lowerDescription.includes('invalid')) {
    return 'The authentication request is invalid. Please start the process again.';
  }

  if (lowerError.includes('network') || lowerDescription.includes('network')) {
    return 'Network error occurred. Please check your connection and try again.';
  }

  if (lowerError.includes('already_connected') || lowerDescription.includes('already connected')) {
    return 'This Google account is already connected to your profile.';
  }

  if (
    lowerError.includes('email_already_exists') ||
    lowerDescription.includes('email already exists')
  ) {
    return 'An account with this email already exists. Please try signing in instead.';
  }

  if (lowerError.includes('feature_disabled')) {
    return 'Google authentication is currently unavailable. Please try again later.';
  }

  // Default message
  return 'Authentication was cancelled or failed. Please try again.';
}

/**
 * Displays a loading state while processing the OAuth callback.
 */
function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Processing...</h1>
            <p className="text-muted-foreground">Completing your authentication...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
