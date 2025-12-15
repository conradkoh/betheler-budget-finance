'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Displays login form for users to authenticate using temporary login codes.
 */
export function LoginWithCode() {
  const router = useRouter();
  const verifyLoginCode = useSessionMutation(api.auth.verifyLoginCode);

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event handlers
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
      'Login'
    );
  }, [isLoading]);

  const formContent = useMemo(
    () => (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="XXXX-XXXX"
            value={code}
            onChange={handleCodeChange}
            className="text-center font-mono text-lg tracking-wider"
            maxLength={9} // 8 characters + 1 dash
            autoComplete="off"
            disabled={isLoading}
            aria-label="Enter login code"
            aria-describedby={error ? 'code-error' : undefined}
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <p id="code-error" className="mt-1 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
          {buttonContent}
        </Button>
      </form>
    ),
    [code, error, isLoading, handleCodeChange, handleSubmit, buttonContent]
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Login with Code</h3>
        <p className="text-sm text-muted-foreground">Enter the login code from your other device</p>
      </div>

      {formContent}

      <p className="text-xs text-muted-foreground text-center">
        The login code is case-insensitive and valid for 1 minute after generation
      </p>
    </div>
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
  const cleanCode = code.replace(/-/g, '');
  if (cleanCode.length !== 8) {
    setError('Please enter a valid 8-character login code');
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
