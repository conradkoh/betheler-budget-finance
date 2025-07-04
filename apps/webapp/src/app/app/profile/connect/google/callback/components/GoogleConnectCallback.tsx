'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useAction } from 'convex/react';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

interface GoogleConnectCallbackProps {
  code: string;
  state: string;
}

/**
 * Google Connect Callback component for handling OAuth callback during account linking.
 * This component processes the OAuth callback and connects the Google account to the current user.
 * Parameters are passed as props to eliminate useEffect and React StrictMode issues.
 */
export const GoogleConnectCallback = ({ code, state }: GoogleConnectCallbackProps) => {
  const router = useRouter();
  const authState = useAuthState();

  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  // Convex functions
  const exchangeGoogleCode = useAction(api.googleAuth.exchangeGoogleCode);
  const connectGoogle = useSessionMutation(api.googleAuth.connectGoogle);

  /**
   * Processes the OAuth callback with the provided parameters.
   */
  const processCallback = useCallback(async () => {
    // Prevent double execution
    if (hasProcessed) {
      console.debug('OAuth callback already processed, skipping...');
      return;
    }

    try {
      console.debug('Starting OAuth callback processing...');
      setHasProcessed(true);

      // Check if user is logged in
      if (authState?.state !== 'authenticated') {
        console.warn('User is not authenticated.');
        setError('You must be logged in to connect a Google account');
        setIsProcessing(false);
        return;
      }

      // Validate CSRF state
      const isStateValid = await _validateCSRFState(state);
      if (!isStateValid) {
        console.warn('CSRF state validation failed');
        setError('Invalid state parameter - possible CSRF attack');
        setIsProcessing(false);
        return;
      }

      // Clean up stored state
      sessionStorage.removeItem('google_oauth_connect_state');

      // Exchange code for profile
      const redirectUri = `${window.location.origin}/app/profile/connect/google/callback`;
      console.debug('Exchanging Google code for profile with redirect URI:', redirectUri);
      const exchangeResult = await exchangeGoogleCode({
        code,
        state,
        redirectUri,
      });

      if (!exchangeResult.success || !exchangeResult.profile) {
        console.error('Failed to exchange code for profile:', exchangeResult);
        throw new Error('Failed to exchange code for profile');
      }

      // Connect Google profile to current user
      console.debug('Connecting Google profile to current user:', exchangeResult.profile);
      const connectResult = await connectGoogle({
        profile: exchangeResult.profile,
      });

      if (!connectResult.success) {
        console.error('Failed to connect Google account:', connectResult);
        throw new Error('Failed to connect Google account');
      }

      // Success!
      let successMessage: string;
      if (connectResult.alreadyConnected) {
        successMessage = 'Google account is already connected to your profile!';
        // Only show toast for already connected if this is the first time we're seeing it
        // (prevents duplicate notifications from React StrictMode)
        console.debug('Google account already connected, skipping duplicate notification.');
      } else if (connectResult.converted) {
        successMessage =
          'Your anonymous account has been upgraded and Google account connected successfully!';
        toast.success(successMessage);
      } else {
        successMessage = 'Google account connected successfully!';
        toast.success(successMessage);
      }

      console.debug('Successfully connected Google account.');
      setIsProcessing(false);
      router.push('/app/profile');
    } catch (error) {
      console.error('Error during OAuth callback processing:', error);

      let errorMessage = 'Failed to connect Google account';
      if (error instanceof Error) {
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

      setError(errorMessage);
      setIsProcessing(false);
    }
  }, [code, state, exchangeGoogleCode, connectGoogle, router, authState, hasProcessed]);

  /**
   * Handles navigation back to profile page.
   */
  const handleReturnToProfile = useCallback(() => {
    console.debug('Navigating back to profile page...');
    router.push('/app/profile');
  }, [router]);

  // Process callback when auth state is ready
  useEffect(() => {
    if (authState?.state === 'authenticated' || authState?.state === 'unauthenticated') {
      processCallback();
    }
  }, [authState?.state, processCallback]);

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
 * Validates CSRF state parameter using simple comparison.
 */
async function _validateCSRFState(state: string): Promise<boolean> {
  try {
    const storedState = sessionStorage.getItem('google_oauth_connect_state');
    const isValid = storedState === state;
    console.debug('CSRF state validation result:', isValid);
    return isValid;
  } catch (_error) {
    console.error('Error validating CSRF state:', _error);
    return false;
  }
}
