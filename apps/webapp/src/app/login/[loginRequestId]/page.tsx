'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Public interfaces and types
export interface LoginRequestPageProps {
  params: Promise<{ loginRequestId: string }>;
}

export interface GoogleIconProps {
  className?: string;
}

// Internal interfaces and types
interface _OAuthState {
  flowType: 'login';
  requestId: string;
  version: 'v1';
}

/**
 * Login request page that handles OAuth popup flow and status polling.
 */
export default function LoginRequestPage({ params }: LoginRequestPageProps) {
  const router = useRouter();
  const [loginRequestId, setLoginRequestId] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Get Google auth config to get client ID and redirect URIs
  const googleConfig = useQuery(api.auth.google.getConfig);

  // Resolve params
  useEffect(() => {
    params.then((resolvedParams) => {
      setLoginRequestId(resolvedParams.loginRequestId);
    });
  }, [params]);

  // Query the login request status
  const loginRequest = useQuery(
    api.auth.google.getLoginRequest,
    loginRequestId ? { loginRequestId: loginRequestId as Id<'auth_loginRequests'> } : 'skip'
  );

  /**
   * Builds the Google OAuth URL with the structured state parameter.
   */
  const buildGoogleOAuthUrl = useCallback(async () => {
    if (!googleConfig?.enabled || !googleConfig?.clientId || !loginRequestId) return null;

    // Generate redirect URI from current window location
    if (typeof window === 'undefined') return null;
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;

    // Create structured state for login flow
    const state = _createLoginOAuthState(loginRequestId);

    const params = new URLSearchParams({
      client_id: googleConfig.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
      prompt: 'consent',
      access_type: 'offline',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }, [googleConfig, loginRequestId]);

  /**
   * Opens the Google OAuth popup and starts polling for status.
   */
  const handleGoogleLogin = useCallback(async () => {
    const authUrl = await buildGoogleOAuthUrl();
    if (!authUrl) {
      toast.error('Failed to build Google OAuth URL');
      return;
    }

    setIsPopupOpen(true);

    // Open popup
    const popup = window.open(
      authUrl,
      'google-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    );

    if (!popup) {
      toast.error('Failed to open popup. Please enable popups and try again.');
      setIsPopupOpen(false);
      return;
    }

    // Poll for popup closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsPopupOpen(false);
      }
    }, 1000);

    // The status polling is handled by the useQuery which automatically re-queries
    // We don't need manual polling since Convex handles real-time updates
  }, [buildGoogleOAuthUrl]);

  /**
   * Handles login request status changes.
   */
  useEffect(() => {
    if (!loginRequest) return;

    if (loginRequest.status === 'completed') {
      // Success! Redirect to app
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      toast.success('Login successful!');
      router.push('/app');
    } else if (loginRequest.status === 'failed') {
      // Failed, show error
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      toast.error(loginRequest.error || 'Login failed');
      setIsPopupOpen(false);
    }
  }, [loginRequest, pollInterval, router]);

  /**
   * Cleanup polling on unmount.
   */
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Loading state
  if (!loginRequestId || loginRequest === undefined || googleConfig === undefined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Invalid login request
  if (!loginRequest) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Invalid Login Request</h1>
            <p className="text-muted-foreground">This login request is invalid or has expired.</p>
          </div>
          <Button onClick={() => router.push('/login')}>Back to Login</Button>
        </div>
      </div>
    );
  }

  // Google auth not available
  if (!googleConfig?.enabled || !googleConfig?.clientId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Authentication Unavailable</h1>
            <p className="text-muted-foreground">
              Google authentication is currently disabled or not configured.
            </p>
          </div>
          <Button onClick={() => router.push('/login')}>Back to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Continue with Google</h1>
          <p className="text-muted-foreground">
            Click the button below to sign in with your Google account
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <GoogleIcon className="h-5 w-5" />
              Google Sign In
            </CardTitle>
            <CardDescription>
              A secure popup will open to complete your authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={isPopupOpen || loginRequest.status !== 'pending'}
              className="w-full"
              size="lg"
            >
              {isPopupOpen ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Waiting for authentication...
                </>
              ) : (
                <>
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Continue with Google
                </>
              )}
            </Button>

            {loginRequest.status === 'pending' && !isPopupOpen && (
              <p className="text-sm text-muted-foreground text-center">Ready to authenticate</p>
            )}

            {isPopupOpen && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Complete the authentication in the popup window
                </p>
                <p className="text-xs text-muted-foreground">
                  If the popup was blocked, please enable popups and try again
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="link" onClick={() => router.push('/login')}>
            Back to Login Options
          </Button>
        </div>
      </div>
    </div>
  );
}

// Internal helper functions
/**
 * Creates OAuth state for login flow with proper typing.
 */
function _createLoginOAuthState(loginRequestId: string): string {
  const state: _OAuthState = {
    flowType: 'login',
    requestId: loginRequestId,
    version: 'v1',
  };
  return encodeURIComponent(JSON.stringify(state));
}

/**
 * Renders the Google brand icon with proper colors and accessibility.
 */
function GoogleIcon({ className }: GoogleIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label="Google"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
