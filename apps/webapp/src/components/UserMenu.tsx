'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuthState } from '@/modules/auth/AuthProvider';

interface UserMenuProps {
  className?: string;
  alignMenu?: 'start' | 'center' | 'end';
  showNameOnMobile?: boolean;
}

/**
 * User menu dropdown component with profile links and logout functionality.
 * Shows user information and navigation options, with admin access for system administrators.
 */
export function UserMenu({ className, alignMenu = 'end', showNameOnMobile = true }: UserMenuProps) {
  const authState = useAuthState();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logout = useSessionMutation(api.auth.logout);

  // Memoize whether we're in mobile menu
  const isMobileMenu = useMemo(() => alignMenu === 'start', [alignMenu]);

  // Use callback for logout handler to prevent unnecessary re-renders
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, router]);

  // Memoize navigation items to ensure consistency with main navigation
  const navItems = useMemo(
    () => [
      { href: '/app/profile', label: 'Profile' },
      { href: '/app', label: 'Dashboard' },
      { href: '/transactions', label: 'Transactions' },
      { href: '/budgets', label: 'Budgets' },
      { href: '/leaderboard', label: 'Leaderboard' },
    ],
    []
  );

  const showLogoutConfirmation = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const handleLogoutConfirmChange = useCallback((open: boolean) => {
    setShowLogoutConfirm(open);
  }, []);

  if (!authState || authState.state !== 'authenticated') {
    return null;
  }

  return (
    <>
      {_renderLogoutConfirmDialog(
        showLogoutConfirm,
        handleLogoutConfirmChange,
        handleLogout,
        isLoggingOut
      )}
      {_renderUserDropdownMenu(
        authState,
        showLogoutConfirmation,
        isLoggingOut,
        isMobileMenu,
        showNameOnMobile,
        className,
        alignMenu,
        navItems
      )}
    </>
  );
}

// 5. Internal helper functions
/**
 * Renders the logout confirmation dialog.
 */
function _renderLogoutConfirmDialog(
  showLogoutConfirm: boolean,
  handleLogoutConfirmChange: (open: boolean) => void,
  handleLogout: () => void,
  isLoggingOut: boolean
) {
  return (
    <AlertDialog open={showLogoutConfirm} onOpenChange={handleLogoutConfirmChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be redirected to the home page after logging out.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Renders the user dropdown menu with navigation links.
 */
function _renderUserDropdownMenu(
  authState: Extract<NonNullable<ReturnType<typeof useAuthState>>, { state: 'authenticated' }>,
  showLogoutConfirmation: () => void,
  isLoggingOut: boolean,
  isMobileMenu: boolean,
  showNameOnMobile: boolean,
  className?: string,
  alignMenu?: 'start' | 'center' | 'end',
  navItems?: { href: string; label: string }[]
) {
  const isSystemAdmin = authState.user.accessLevel === 'system_admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'relative flex items-center gap-2 text-sm font-medium focus:outline-none text-muted-foreground hover:text-foreground',
            isMobileMenu ? 'w-full justify-start py-2 px-3' : '',
            !showNameOnMobile ? 'md:gap-2' : '',
            className
          )}
        >
          <User className="h-4 w-4" />
          <span className={cn(!showNameOnMobile && 'hidden md:inline')}>{authState.user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align={alignMenu}
        className={cn('w-56', isMobileMenu ? 'w-full max-w-none' : '')}
        sideOffset={isMobileMenu ? 0 : 4}
        forceMount
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{authState.user.name}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {navItems?.map((item) => (
          <Link href={item.href} key={item.href}>
            <DropdownMenuItem className="cursor-pointer py-2">{item.label}</DropdownMenuItem>
          </Link>
        ))}

        {isSystemAdmin && (
          <Link href="/app/admin">
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="h-4 w-4" />
              System Admin
            </DropdownMenuItem>
          </Link>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2"
          onClick={showLogoutConfirmation}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? 'Logging out...' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
