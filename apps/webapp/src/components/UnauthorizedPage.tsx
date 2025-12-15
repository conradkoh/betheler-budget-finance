import { LockKeyhole } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        <div className="mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <LockKeyhole className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">
            You need to be logged in to access this page. Please sign in to view your financial data
            securely.
          </p>
        </div>
        <div className="space-y-4">
          <Link href="/login" className="block">
            <Button className="w-full">Sign In</Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
