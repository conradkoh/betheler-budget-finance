'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { formatLoginCode } from '@workspace/backend/modules/auth/codeUtils';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { Check, Copy, Loader2, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuthState } from '@/modules/auth/AuthProvider';

/**
 * Displays login code generator for authenticated users to access their account on other devices.
 */
export function LoginCodeGenerator() {
  const authState = useAuthState();
  const createLoginCode = useSessionMutation(api.auth.createLoginCode);
  const activeCodeQuery = useSessionQuery(api.auth.getActiveLoginCode);

  const [isGenerating, setIsGenerating] = useState(false);
  const [loginCode, setLoginCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Computed values
  const getTimeRemaining = useCallback(() => _getTimeRemaining(expiresAt), [expiresAt]);
  const [timeRemaining, setTimeRemaining] = useState<string>(getTimeRemaining());

  const isAuthenticatedUser = useMemo(() => {
    return authState?.state === 'authenticated' && 'user' in authState;
  }, [authState]);

  const buttonText = useMemo(() => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Generating...</span>
        </>
      );
    }
    return loginCode ? 'Generate New Code' : 'Generate Login Code';
  }, [isGenerating, loginCode]);

  // Keep login code synced with active code from backend
  useEffect(() => {
    if (!activeCodeQuery) return;

    if (activeCodeQuery.success && activeCodeQuery.code && activeCodeQuery.expiresAt) {
      // We have an active code
      if (loginCode !== activeCodeQuery.code) {
        setLoginCode(activeCodeQuery.code);
        setExpiresAt(activeCodeQuery.expiresAt);
        setIsExpired(false);
      }
    } else {
      // No active code or code was consumed
      if (loginCode) {
        setLoginCode(null);
        setExpiresAt(null);
        setIsExpired(false);

        // Only show notification if code was used (not expired)
        if (activeCodeQuery.reason === 'no_active_code' && !isExpired) {
          toast.info('Your login code was used successfully');
        }
      }
    }
  }, [activeCodeQuery, loginCode, isExpired]);

  // Update timer every second
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);

      // If expired, mark as expired (only once)
      if (remaining === '0:00' && !isExpired) {
        setIsExpired(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, getTimeRemaining, isExpired]);

  // Event handlers
  const handleGenerateCode = useCallback(async () => {
    // Reset expired state when generating new code
    setIsExpired(false);
    await _handleGenerateCode({
      authState,
      isGenerating,
      setIsGenerating,
      createLoginCode,
      setLoginCode,
      setExpiresAt,
      setTimeRemaining,
      getTimeRemaining,
    });
  }, [authState, isGenerating, createLoginCode, getTimeRemaining]);

  const handleCopyCode = useCallback(async () => {
    if (!loginCode) return;

    try {
      await navigator.clipboard.writeText(loginCode);
      setIsCopied(true);
      toast.success('Code copied to clipboard');

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast.error('Failed to copy code to clipboard');
    }
  }, [loginCode]);

  const handleClearCode = useCallback(() => {
    setLoginCode(null);
    setExpiresAt(null);
    setIsExpired(false);
    setIsCopied(false);
  }, []);

  // Early return if not an authenticated user
  if (!isAuthenticatedUser) {
    return null;
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Use Your Account on Another Device</h3>
        <p className="text-sm text-muted-foreground">
          Generate a temporary login code to access your account from another device
        </p>
      </div>

      <div className="p-6">
        {loginCode ? (
          <div className="space-y-4">
            {isExpired ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-center relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearCode}
                    aria-label="Clear login code"
                    className="absolute top-2 right-2 h-6 w-6"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <p className="text-sm text-muted-foreground mb-1">Your login code:</p>
                  <p
                    className="text-3xl font-mono font-bold tracking-wider text-muted-foreground/40"
                    aria-live="polite"
                  >
                    {formatLoginCode(loginCode)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Expired</p>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-sm text-muted-foreground">This code is no longer valid</p>
                  <Button onClick={handleGenerateCode} disabled={isGenerating} size="sm">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                        Generate New Code
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">Your login code:</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-3xl font-mono font-bold tracking-wider" aria-live="polite">
                      {formatLoginCode(loginCode)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyCode}
                      aria-label="Copy login code to clipboard"
                      className="h-9 w-9"
                    >
                      {isCopied ? (
                        <Check
                          className="h-5 w-5 text-green-600 dark:text-green-400"
                          aria-hidden="true"
                        />
                      ) : (
                        <Copy className="h-5 w-5" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2" aria-live="polite">
                    Valid for {timeRemaining}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    Enter this code on the login page of your other device to access your account.
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm space-y-2">
            <p>
              Generate a temporary login code that allows you to access your account from another
              device. The code will be valid for 1 minute.
            </p>
            <p>
              <strong>Note:</strong> This will invalidate any previously generated codes.
            </p>
          </div>
        )}
      </div>

      {!isExpired && (
        <div className="p-4 bg-secondary/50 border-t flex justify-end">
          <Button
            onClick={handleGenerateCode}
            disabled={isGenerating}
            aria-busy={isGenerating}
            aria-label={loginCode ? 'Generate a new login code' : 'Generate a login code'}
          >
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Calculates time remaining until code expiration in MM:SS format.
 */
function _getTimeRemaining(expiresAt: number | null): string {
  if (!expiresAt) return '';

  const timeLeft = Math.max(0, expiresAt - Date.now());
  const minutes = Math.floor(timeLeft / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface _HandleGenerateCodeParams {
  authState: ReturnType<typeof useAuthState>;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  createLoginCode: () => Promise<{ success: boolean; code?: string; expiresAt?: number }>;
  setLoginCode: (code: string | null) => void;
  setExpiresAt: (expiresAt: number | null) => void;
  setTimeRemaining: (time: string) => void;
  getTimeRemaining: () => string;
}

/**
 * Handles login code generation with authentication validation and error handling.
 */
async function _handleGenerateCode(params: _HandleGenerateCodeParams): Promise<void> {
  const {
    authState,
    isGenerating,
    setIsGenerating,
    createLoginCode,
    setLoginCode,
    setExpiresAt,
    setTimeRemaining,
    getTimeRemaining,
  } = params;

  if (authState?.state !== 'authenticated') {
    toast.error('You must be logged in to generate a login code');
    return;
  }

  if (isGenerating) return;

  setIsGenerating(true);
  try {
    const result = await createLoginCode();
    if (result.success && result.code && result.expiresAt) {
      setLoginCode(result.code);
      setExpiresAt(result.expiresAt);
      setTimeRemaining(getTimeRemaining());
      toast.success('Login code generated successfully');
    } else {
      toast.error('Failed to generate login code');
    }
  } catch (error) {
    console.error('Error generating login code:', error);
    toast.error('An error occurred while generating login code');
  } finally {
    setIsGenerating(false);
  }
}
