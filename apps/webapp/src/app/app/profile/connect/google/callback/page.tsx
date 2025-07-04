import { Suspense } from 'react';
import { GoogleConnectCallback } from './components/GoogleConnectCallback';

export default function GoogleConnectCallbackPage() {
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
      <GoogleConnectCallback />
    </Suspense>
  );
}
