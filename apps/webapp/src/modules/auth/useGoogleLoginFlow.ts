'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useGoogleAuthAvailable } from '@/modules/app/useAppInfo';

/**
 * Hook for managing the new Google login flow with backend-driven OAuth.
 * Creates a login request and redirects to the login page.
 */
export function useGoogleLoginFlow() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const googleAuthAvailable = useGoogleAuthAvailable();
  const createLoginRequest = useSessionMutation(api.auth.google.createLoginRequest);

  /**
   * Initiates the Google login flow by creating a login request and redirecting.
   */
  const startGoogleLogin = useCallback(async () => {
    // Check if Google auth is enabled
    if (!googleAuthAvailable) {
      toast.error('Google authentication is currently disabled or not configured');
      return;
    }

    setIsLoading(true);
    try {
      // Generate redirect URI from current window location
      if (typeof window === 'undefined') {
        throw new Error('Window is not available');
      }

      const redirectUri = `${window.location.origin}/api/auth/google/callback`;

      // Create a login request in the backend
      const result = await createLoginRequest({ redirectUri });

      // Redirect to the login page with the loginRequestId
      router.push(`/login/${result.loginId}`);
    } catch (_error) {
      toast.error('Failed to start Google login. Please try again.');
      setIsLoading(false);
    }
  }, [googleAuthAvailable, createLoginRequest, router]);

  return {
    startGoogleLogin,
    isLoading,
    isAvailable: !!googleAuthAvailable,
  };
}
