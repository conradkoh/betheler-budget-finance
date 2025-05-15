'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DarkModeToggle } from '@/components/ui/darkMode';
import { Textarea } from '@/components/ui/textarea';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { LoginCodeGenerator } from '@/modules/auth/LoginCodeGenerator';
import { NameEditForm } from '@/modules/profile/NameEditForm';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionId } from 'convex-helpers/react/sessions';
import { useAction } from 'convex/react';
import { CopyIcon, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

// Recovery Code Component
function RecoveryCodeSection() {
  const getOrCreateCode = useAction(api.auth.getOrCreateRecoveryCode);
  const regenerateCode = useAction(api.auth.regenerateRecoveryCode);
  const [sessionId] = useSessionId();
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRevealCode = async () => {
    if (!sessionId) {
      setError('Session not found. Cannot fetch recovery code.');
      toast.error('Session not found.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getOrCreateCode({ sessionId });
      if (result.success && result.recoveryCode) {
        setRecoveryCode(result.recoveryCode);
      } else {
        setError(result.reason || 'Failed to retrieve recovery code.');
        toast.error(result.reason || 'Failed to retrieve recovery code.');
      }
    } catch (err) {
      console.error('Error revealing recovery code:', err);
      setError('An unexpected error occurred.');
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!sessionId) {
      setError('Session not found. Cannot regenerate recovery code.');
      toast.error('Session not found.');
      return;
    }
    setIsRegenerating(true);
    setError(null);

    try {
      const result = await regenerateCode({ sessionId });
      if (result.success && result.recoveryCode) {
        setRecoveryCode(result.recoveryCode);
        toast.success('Recovery code regenerated successfully!');
      } else {
        setError(result.reason || 'Failed to regenerate recovery code.');
        toast.error(result.reason || 'Failed to regenerate recovery code.');
      }
    } catch (err) {
      console.error('Error regenerating recovery code:', err);
      setError('An unexpected error occurred.');
      toast.error('An unexpected error occurred.');
    } finally {
      setIsRegenerating(false);
      setDialogOpen(false);
    }
  };

  const handleCopyCode = () => {
    if (recoveryCode) {
      navigator.clipboard
        .writeText(recoveryCode)
        .then(() => {
          toast.success('Recovery code copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
          toast.error('Failed to copy code.');
        });
    }
  };

  return (
    <div className="border-t pt-6">
      <h2 className="text-xl font-semibold mb-2">Account Recovery</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--muted-text)' }}>
        Keep this recovery code in a safe place. It's the only way to regain access to your
        anonymous account if you lose access.
      </p>
      {!recoveryCode ? (
        <Button onClick={handleRevealCode} disabled={isLoading}>
          {isLoading ? 'Revealing...' : 'Reveal Recovery Code'}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Textarea
              value={recoveryCode}
              readOnly
              className="font-mono text-sm whitespace-normal break-all h-auto min-h-[100px] resize-none"
              onClick={(e: React.MouseEvent<HTMLTextAreaElement>) => {
                // Select all text when clicked for easy copying
                e.currentTarget.select();
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              aria-label="Copy recovery code"
              title="Copy to clipboard"
              className="self-end"
            >
              <CopyIcon className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
          </div>

          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={isRegenerating}
              >
                <RefreshCw className="h-4 w-4" />
                {isRegenerating ? 'Regenerating...' : 'Regenerate Code'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Regenerating your recovery code will{' '}
                  <span className="font-bold text-red-500">invalidate your old code</span>. This
                  action cannot be undone. Your old recovery code will no longer work!
                  <br />
                  <br />
                  Make sure to save your new code in a secure location after regenerating.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRegenerateCode}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Regenerate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const authState = useAuthState();

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => authState?.state === 'authenticated', [authState]);

  // Check if user is anonymous
  const isAnonymousUser = useMemo(
    () =>
      isAuthenticated && authState && 'user' in authState && authState.user.type === 'anonymous',
    [authState, isAuthenticated]
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6">
          <DarkModeToggle />
        </div>
        <Card className="p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

          {isAuthenticated && (
            <div className="space-y-8">
              <div className="p-4 rounded-md bg-muted dark:bg-muted/20">
                <h2 className="text-xl font-semibold mb-2">Account Information</h2>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="font-medium">Account Type:</span>
                    {isAnonymousUser ? (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--badge-anonymous-bg)',
                          color: 'var(--badge-anonymous-text)',
                        }}
                      >
                        Anonymous
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--badge-full-bg)',
                          color: 'var(--badge-full-text)',
                        }}
                      >
                        Full Account
                      </span>
                    )}
                  </div>
                  {isAnonymousUser && (
                    <div className="mt-2 text-sm text-gray-500">
                      You are using an anonymous account. Your data will be available as long as you
                      use the same device and don't clear your browser data.
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <NameEditForm />
              </div>

              {isAnonymousUser && (
                <div className="border-t pt-6">
                  <LoginCodeGenerator />
                </div>
              )}

              {isAnonymousUser && <RecoveryCodeSection />}

              <div className="border-t pt-6 flex justify-end">
                <Link href="/app">
                  <Button variant="outline" aria-label="Return to app">
                    Back to App
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
