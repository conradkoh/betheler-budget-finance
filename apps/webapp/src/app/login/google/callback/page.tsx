import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { GoogleCallback } from '../components/GoogleCallback';

/**
 * Props for Google OAuth callback page component.
 */
interface GoogleCallbackPageProps {
  searchParams: Promise<{
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }>;
}

/**
 * Handles Google OAuth callback with error handling and parameter validation.
 */
export default async function GoogleCallbackPage({ searchParams }: GoogleCallbackPageProps) {
  const params = await searchParams;

  // Handle OAuth errors immediately on the server
  if (params.error) {
    console.error('OAuth error:', params.error, params.error_description);
    // Redirect to login - user will see error there if needed
    redirect('/login');
  }

  // Validate required parameters
  if (!params.code || !params.state) {
    console.error('Missing OAuth parameters');
    redirect('/login');
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">Loading...</h1>
                <p className="text-muted-foreground">Completing Google authentication...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <GoogleCallback code={params.code} state={params.state} />
    </Suspense>
  );
}
