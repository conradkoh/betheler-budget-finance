'use client';

import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { featureFlags } from '@workspace/backend/config/featureFlags';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export function Navigation() {
  const authState = useAuthState();
  const isAuthenticated = authState?.state === 'authenticated';
  const isLoading = authState === undefined;

  const pathname = usePathname();

  // Memoize navigation items to prevent unnecessary recalculations
  const navItems = useMemo(
    () => [
      ...(isAuthenticated
        ? [
            {
              href: '/app',
              label: 'Dashboard',
              isActive: pathname === '/app',
            },
            {
              href: '/transactions',
              label: 'Transactions',
              isActive: pathname.startsWith('/transactions'),
            },
            {
              href: '/budgets',
              label: 'Budgets',
              isActive: pathname.startsWith('/budgets'),
            },
            // Leaderboard moved inside authenticated section for consistency
            {
              href: '/leaderboard',
              label: 'Leaderboard',
              isActive: pathname.startsWith('/leaderboard'),
            },
          ]
        : []),
    ],
    [pathname, isAuthenticated]
  );

  // Memoize login button to prevent unnecessary re-renders
  const loginButton = useMemo(
    () => (
      <Link href="/login" className="w-full">
        <Button size="sm" variant="outline" className="w-full">
          Login
        </Button>
      </Link>
    ),
    []
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex">
          {/* Link to /app (dashboard) instead of home page */}
          <Link
            href={isAuthenticated ? '/app' : '/'}
            className="flex items-center whitespace-nowrap"
          >
            <span className="font-bold text-lg">Budget</span>
          </Link>
        </div>

        {/* Main container for navigation and user menu */}
        <div className="flex items-center justify-between gap-4">
          {/* Desktop navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  item.isActive ? 'text-foreground font-medium' : 'text-foreground/60'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User menu - visible on all screens */}
          <div>
            {!isLoading &&
              (isAuthenticated ? (
                <UserMenu showNameOnMobile={false} alignMenu="end" />
              ) : (
                !featureFlags.disableLogin && loginButton
              ))}
          </div>
        </div>
      </div>
    </header>
  );
}
