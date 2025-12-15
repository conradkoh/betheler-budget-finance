'use client';

import { EyeOffIcon as HideIcon, LockIcon, MoreVerticalIcon } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';

import { usePasswordProtection } from './PasswordProtectContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface PasswordProtectProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showActionMenu?: boolean;
}

export function PasswordProtect({
  children,
  title = 'Protected Content',
  description = 'Please enter the password to view this content.',
  showActionMenu = true,
}: PasswordProtectProps) {
  const {
    isAuthorized,
    isLoading,
    error,
    authenticate,
    logout,
    temporarilyHide,
    unhide,
    isTemporarilyHidden,
  } = usePasswordProtection();

  const [password, setPassword] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const success = await authenticate(password);
      if (success) {
        setPassword(''); // Clear password from memory
      }
    },
    [password, authenticate]
  );

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  // Show loading state while checking localStorage
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary" />
            <LockIcon className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">Checking authentication...</p>
            <p className="text-xs text-muted-foreground">Please wait while we verify your access</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthorized) {
    return (
      <div className="relative">
        {/* Action Menu */}
        {showActionMenu && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90"
                >
                  <MoreVerticalIcon className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={temporarilyHide} className="cursor-pointer">
                  <HideIcon className="mr-2 h-4 w-4" />
                  Hide temporarily
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                  <LockIcon className="mr-2 h-4 w-4" />
                  Lock content
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Content */}
        <div
          className={`transition-all duration-300 ${
            isTemporarilyHidden ? 'blur-md select-none pointer-events-none' : ''
          }`}
        >
          {children}
        </div>

        {/* Unhide overlay when temporarily hidden */}
        {isTemporarilyHidden && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm">
            <Button
              onClick={unhide}
              variant="secondary"
              size="sm"
              className="bg-background/90 backdrop-blur-sm border border-border/50"
            >
              <HideIcon className="mr-2 h-4 w-4" />
              Show content
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <LockIcon className="h-6 w-6" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter password"
                  disabled={isLoading}
                  className={error ? 'border-red-500' : ''}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !password.trim()}>
              {isLoading ? 'Verifying...' : 'Unlock Content'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
