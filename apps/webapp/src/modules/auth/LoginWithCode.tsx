'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Displays login form for users to authenticate using temporary login codes.
 *
 * Design: Minimal and clean, matching the main login page aesthetic.
 * The input uses monospace font with centered text for code entry.
 */
export function LoginWithCode() {
  const router = useRouter();
  const verifyLoginCode = useSessionMutation(api.auth.verifyLoginCode);
  const inputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-focus input on mount for immediate code entry
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Event handlers
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); // Clear error when user starts typing
    _handleCodeChange(e, setCode);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      await _handleSubmit({
        e,
        code,
        setIsLoading,
        setError,
        verifyLoginCode,
        router,
      });
    },
    [code, router, verifyLoginCode]
  );

  // Computed values
  const buttonContent = useMemo(() => {
    return isLoading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Verifying...</span>
      </>
    ) : (
      'Continue'
    );
  }, [isLoading]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          ref={inputRef}
          id="login-code"
          type="text"
          placeholder="XXXX-XXXX"
          value={code}
          onChange={handleCodeChange}
          className="text-center font-mono text-lg tracking-widest"
          maxLength={9} // 8 characters + 1 dash
          autoComplete="off"
          disabled={isLoading}
          aria-label="Enter login code"
          aria-describedby={error ? 'code-error' : 'code-hint'}
          aria-invalid={error ? true : undefined}
        />
        {error ? (
          <p id="code-error" className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        ) : (
          <p id="code-hint" className="text-xs text-muted-foreground text-center">
            Enter the 8-character code from your other device
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
        {buttonContent}
      </Button>

      <div className="pt-2 space-y-1 text-xs text-muted-foreground text-center">
        <p>Generate a code from your Profile settings on your logged-in device.</p>
        <p>Codes are case-insensitive and valid for 1 minute.</p>
      </div>
    </form>
  );
}

/**
 * Handles code input formatting with automatic dash insertion after 4 characters.
 */
function _handleCodeChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setCode: (code: string) => void
): void {
  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (value.length <= 8) {
    if (value.length <= 4) {
      setCode(value);
    } else {
      const formattedCode = `${value.slice(0, 4)}-${value.slice(4, 8)}`;
      setCode(formattedCode);
    }
  }
}

interface _HandleSubmitParams {
  e: React.FormEvent;
  code: string;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  verifyLoginCode: (params: { code: string }) => Promise<{ success: boolean; message: string }>;
  router: ReturnType<typeof useRouter>;
}

/**
 * Handles form submission for login code verification with validation and error handling.
 */
async function _handleSubmit(params: _HandleSubmitParams): Promise<void> {
  const { e, code, setIsLoading, setError, verifyLoginCode, router } = params;

  e.preventDefault();

  // Validate code format
  const cleanCode = code.replace(/-/g, '').trim();
  if (cleanCode.length === 0) {
    setError('Please enter your login code');
    return;
  }
  if (cleanCode.length !== 8) {
    setError(
      `Code must be 8 characters. You entered ${cleanCode.length} character${cleanCode.length !== 1 ? 's' : ''}.`
    );
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const result = await verifyLoginCode({ code: cleanCode });

    if (result.success) {
      toast.success('Login successful');
      router.push('/app');
    } else {
      setError(result.message);
      toast.error(result.message);
    }
  } catch (error) {
    console.error('Failed to verify login code:', error);
    setError('An unexpected error occurred. Please try again.');
    toast.error('Failed to verify code. Please try again.');
  } finally {
    setIsLoading(false);
  }
}
