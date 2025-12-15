'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { ChevronRight, Loader2, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface AnonymousLoginButtonProps {
  variant?: 'list' | 'button';
  className?: string;
}

/**
 * Anonymous login button component that allows users to sign in without creating an account.
 * Supports both list-style and button-style layouts with loading states.
 */
export const AnonymousLoginButton = ({
  variant = 'button',
  className = 'w-full',
}: AnonymousLoginButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const loginAnon = useSessionMutation(api.auth.loginAnon);

  /**
   * Handles anonymous login button click with error handling and navigation.
   */
  const handleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      await loginAnon();
      toast.success('Logged in anonymously');
      router.push('/app');
    } catch (error) {
      console.error('Anonymous login failed:', error);
      toast.error('Failed to login. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [loginAnon, router]);

  // List-style layout
  if (variant === 'list') {
    return _renderListVariant(isLoading, handleClick);
  }

  // Button layout (original)
  return _renderButtonVariant(isLoading, handleClick, className);
};

// Internal helper functions
/**
 * Renders the list-style variant of the anonymous login button.
 */
function _renderListVariant(isLoading: boolean, handleClick: () => void) {
  return (
    <button
      type="button"
      className="flex items-center justify-between w-full h-16 px-6 hover:bg-muted/50 transition-colors cursor-pointer group border-0 bg-transparent text-left disabled:cursor-not-allowed disabled:opacity-50"
      onClick={handleClick}
      disabled={isLoading}
      aria-label="Continue anonymously without creating an account"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8">
          <UserCheck className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-left">
            {isLoading ? 'Signing in...' : 'Continue Anonymously'}
          </span>
          <span className="text-sm text-muted-foreground text-left">No account required</span>
        </div>
      </div>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      )}
    </button>
  );
}

/**
 * Renders the button-style variant of the anonymous login button with tooltip.
 */
function _renderButtonVariant(isLoading: boolean, handleClick: () => void, className: string) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={handleClick}
            disabled={isLoading}
            className={className}
          >
            {isLoading ? 'Logging in...' : 'Login Anonymously'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Continue without creating an account</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
