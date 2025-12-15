'use client';

import { ChevronRight } from 'lucide-react';

import { useGoogleLoginFlow } from './useGoogleLoginFlow';

import { Button } from '@/components/ui/button';

export interface GoogleLoginButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  showChevron?: boolean;
}

interface GoogleIconProps {
  className?: string;
}

/**
 * Google login button component with OAuth integration.
 * Uses the new backend-driven OAuth flow with popup windows.
 */
export const GoogleLoginButton = ({
  className = 'w-full',
  variant = 'outline',
  showChevron = false,
}: GoogleLoginButtonProps) => {
  const { startGoogleLogin, isLoading, isAvailable } = useGoogleLoginFlow();

  // List-style layout
  if (variant === 'ghost' && showChevron) {
    return (
      <button
        type="button"
        className="flex items-center justify-between w-full h-16 px-6 hover:bg-muted/50 transition-colors cursor-pointer group border-0 bg-transparent text-left disabled:cursor-not-allowed disabled:opacity-50"
        onClick={startGoogleLogin}
        disabled={isLoading || !isAvailable}
        aria-label="Sign in with Google"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8">
            <GoogleIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-left">
              {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </span>
            <span className="text-sm text-muted-foreground text-left">
              Sign in with your Google account
            </span>
          </div>
        </div>
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>
    );
  }

  return (
    <Button
      variant={variant}
      onClick={startGoogleLogin}
      disabled={isLoading || !isAvailable}
      className={className}
    >
      {isLoading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Connecting to Google...
        </>
      ) : (
        <>
          <GoogleIcon className="mr-2 h-4 w-4" />
          Continue with Google
        </>
      )}
    </Button>
  );
};

/**
 * Renders the Google brand icon with proper colors and accessibility.
 */
function GoogleIcon({ className }: GoogleIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label="Google"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
