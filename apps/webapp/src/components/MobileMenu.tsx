'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuthState } from '@/modules/auth/AuthProvider';

interface NavigationItem {
  href: string;
  label: string;
  isActive: boolean;
}

interface MobileMenuProps {
  items: NavigationItem[];
  isAuthenticated: boolean;
  loginButton: React.ReactNode;
  userMenu: React.ReactNode;
}

export function MobileMenu({ items, isAuthenticated, loginButton, userMenu }: MobileMenuProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const _authState = useAuthState();

  const handleLinkClick = useCallback(() => {
    setOpen(false);
  }, []);

  const menuTrigger = React.useMemo(
    () => (
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>
    ),
    []
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{menuTrigger}</SheetTrigger>
      <SheetContent side="left" className="w-[80%] max-w-[300px] sm:max-w-sm">
        <div className="flex flex-col h-full">
          <div className="pt-6 pb-4 border-b">
            <Link
              href={isAuthenticated ? '/app' : '/'}
              onClick={handleLinkClick}
              className="flex items-center"
            >
              <span className="font-bold text-xl">Budget</span>
            </Link>
          </div>

          <nav className="flex flex-col gap-1 pt-4 flex-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center py-3 px-3 rounded-md transition-colors hover:bg-accent',
                  item.isActive ? 'text-foreground font-medium bg-accent/50' : 'text-foreground/60'
                )}
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated && !pathname.startsWith('/app') && (
              <Link
                href="/app"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center py-3 px-3 rounded-md transition-colors hover:bg-accent',
                  pathname.startsWith('/app')
                    ? 'text-foreground font-medium bg-accent/50'
                    : 'text-foreground/60'
                )}
              >
                Dashboard
              </Link>
            )}
          </nav>

          <div className="py-4 border-t mt-auto">
            {isAuthenticated ? (
              <div className="px-3">{userMenu}</div>
            ) : (
              <div className="px-3">{loginButton}</div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
