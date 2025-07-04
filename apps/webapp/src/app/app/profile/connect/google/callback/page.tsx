import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { GoogleConnectCallback } from './components/GoogleConnectCallback';

interface GoogleConnectCallbackPageProps {
  searchParams: Promise<{
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }>;
}

export default async function GoogleConnectCallbackPage({
  searchParams,
}: GoogleConnectCallbackPageProps) {
  const params = await searchParams;

  // Handle OAuth errors immediately on the server
  if (params.error) {
    const errorMessage =
      params.error === 'access_denied'
        ? 'Google sign-in was cancelled'
        : `Google OAuth error: ${params.error}${params.error_description ? ` - ${params.error_description}` : ''}`;

    // Redirect to profile with error
    redirect(`/app/profile?error=${encodeURIComponent(errorMessage)}`);
  }

  // Validate required parameters
  if (!params.code || !params.state) {
    redirect(`/app/profile?error=${encodeURIComponent('Missing OAuth parameters')}`);
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-gray-900">Connecting...</h1>
                <p className="text-gray-600">Linking your Google account...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <GoogleConnectCallback code={params.code} state={params.state} />
    </Suspense>
  );
}
