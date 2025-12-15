// 1. Imports (external first, then internal)
'use client';

import { CheckCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// 2. Public interfaces and types
export interface CallbackSuccessCardProps {
  flowType?: 'login' | 'connect';
  autoCloseDelay?: number; // in seconds
  onClose?: () => void;
  userName?: string;
}

// 3. Internal interfaces and types (prefixed with _)
// None needed for this file

// 4. Main exported functions/components
/**
 * Displays OAuth callback success with automatic window closure and countdown timer.
 */
export function CallbackSuccessCard({
  flowType = 'login',
  autoCloseDelay = 3,
  onClose,
  userName,
}: CallbackSuccessCardProps) {
  const [countdown, setCountdown] = useState(autoCloseDelay);
  const [isClosing, setIsClosing] = useState(false);

  // Auto-close functionality with countdown
  useEffect(() => {
    if (countdown <= 0) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          window.close();
        }
      }, 500); // Small delay for smooth transition

      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onClose]);

  const handleManualClose = () => {
    setIsClosing(true);
    if (onClose) {
      onClose();
    } else {
      window.close();
    }
  };

  const successMessage = _getSuccessMessage(flowType, userName);
  const description = _getDescription(flowType);
  const progressPercentage = ((autoCloseDelay - countdown) / autoCloseDelay) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card
          className={`border-green-200 transition-all duration-500 ${isClosing ? 'opacity-50 scale-95' : ''}`}
        >
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">
              {flowType === 'connect' ? 'Account Connected!' : 'Sign In Successful!'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">{successMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">{description}</p>

            {/* Auto-close countdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Closing automatically</span>
                <span>{countdown}s</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Manual close button */}
            <Button
              variant="outline"
              onClick={handleManualClose}
              className="w-full"
              disabled={isClosing}
            >
              <X className="mr-2 h-4 w-4" />
              Close Now
            </Button>
          </CardContent>
        </Card>

        {/* Additional info for connect flow */}
        {flowType === 'connect' && (
          <div className="text-center text-sm text-muted-foreground">
            <p>You can now use Google to sign in to your account in the future.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 5. Internal helper functions (at bottom)
/**
 * Generates the appropriate success message based on flow type and user name.
 */
function _getSuccessMessage(flowType: 'login' | 'connect', userName?: string): string {
  if (flowType === 'connect') {
    return userName
      ? `Google account connected successfully for ${userName}!`
      : 'Google account connected successfully!';
  }

  return userName ? `Welcome back, ${userName}!` : 'Sign in successful!';
}

/**
 * Generates the appropriate description message based on flow type.
 */
function _getDescription(flowType: 'login' | 'connect'): string {
  if (flowType === 'connect') {
    return 'Your Google account has been linked to your profile. You can now use Google to sign in.';
  }

  return 'You have been successfully signed in with Google. Redirecting you now...';
}
