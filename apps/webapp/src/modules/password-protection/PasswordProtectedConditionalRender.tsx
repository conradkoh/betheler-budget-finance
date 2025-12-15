'use client';

import type React from 'react';

import { usePasswordProtection } from './PasswordProtectContext';

export interface PasswordProtectedConditionalRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoadingState?: boolean;
}

export function PasswordProtectedConditionalRender({
  children,
  fallback = null,
  showLoadingState = false,
}: PasswordProtectedConditionalRenderProps) {
  const { isAuthorized, isLoading, isTemporarilyHidden } = usePasswordProtection();

  // Show loading state if requested and currently loading
  if (showLoadingState && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authorized
  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  // Apply blur effect if temporarily hidden
  if (isTemporarilyHidden) {
    return <div className="blur-md select-none pointer-events-none">{children}</div>;
  }

  // Render children normally when authorized and not hidden
  return <>{children}</>;
}
