'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useAction } from 'convex/react';
import { useSessionId } from 'convex-helpers/react/sessions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AuthProvider } from '@/modules/auth/AuthProvider';

/**
 * Account recovery page that allows users to recover their account using a recovery code.
 * Wraps the recovery form with authentication provider for session management.
 */
export default function RecoverAccountPage() {
  return (
    <AuthProvider>
      <RecoverAccountForm />
    </AuthProvider>
  );
}

/**
 * Main recovery form component that handles recovery code verification and account restoration.
 */
function RecoverAccountForm() {
  const verifyCode = useAction(api.auth.verifyRecoveryCode);
  const [sessionId, refreshSessionId] = useSessionId();
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!sessionId) {
        setError('Session ID is missing. Cannot recover account.');
        toast.error('Session ID is missing.');
        return;
      }
      if (!recoveryCode.trim()) {
        setError('Please enter your recovery code.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await verifyCode({ recoveryCode: recoveryCode.trim(), sessionId });

        if (result.success && result.user) {
          toast.success('Account recovered successfully!');
          // Refresh the session ID to reflect the newly associated user
          await refreshSessionId();
          // Redirect to the app page after successful recovery
          router.push('/app');
        } else {
          const reason = result.reason || 'invalid_code';
          let errorMessage = 'Invalid recovery code.';
          if (reason === 'user_not_found') {
            errorMessage = 'User associated with this code not found.';
          } else if (reason !== 'invalid_code') {
            errorMessage = 'Failed to verify recovery code.';
          }
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (error) {
        console.error('Error verifying recovery code:', error);
        setError('An unexpected error occurred during recovery.');
        toast.error('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, recoveryCode, verifyCode, refreshSessionId, router]
  );

  const handleRecoveryCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRecoveryCode(e.target.value);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">Recover Account</CardTitle>
            <CardDescription className="pt-1">
              Enter your recovery code below to regain access to your anonymous account.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pb-6">
              <div className="space-y-3">
                <Label htmlFor="recovery-code" className="text-sm font-medium">
                  Recovery Code
                </Label>
                <Textarea
                  id="recovery-code"
                  value={recoveryCode}
                  onChange={handleRecoveryCodeChange}
                  placeholder="Paste your recovery code here"
                  required
                  disabled={isLoading}
                  className="font-mono text-sm min-h-[100px] whitespace-normal break-all resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This is the 128-character code you saved when setting up your anonymous account.
                </p>
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2 px-6">
              <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                {isLoading ? 'Verifying...' : 'Recover Account'}
              </Button>
              <Link
                href="/login"
                className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-4 pt-2"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back to Login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
