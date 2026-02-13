import { render, screen } from '@testing-library/react';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Navigation } from './Navigation';

import { useAuthState } from '@/modules/auth/AuthProvider';

// Mock the auth module
vi.mock('@/modules/auth/AuthProvider', () => ({
  useAuthState: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: { href: string; children: ReactNode } & ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock UserMenu component
vi.mock('@/components/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

// Mock feature flags
vi.mock('@workspace/backend/config/featureFlags', () => ({
  featureFlags: {
    disableLogin: false,
  },
}));

describe('Navigation', () => {
  it('renders login button when user is not authenticated', () => {
    vi.mocked(useAuthState).mockReturnValue({
      sessionId: 'test-session',
      state: 'unauthenticated',
      reason: 'test',
    });

    render(<Navigation />);

    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  it('renders user menu when user is authenticated', () => {
    vi.mocked(useAuthState).mockReturnValue({
      sessionId: 'test-session',
      state: 'authenticated',
      user: {
        _id: 'test-user-id' as Id<'users'>,
        _creationTime: Date.now(),
        type: 'anonymous',
        name: 'Test User',
      },
      accessLevel: 'user',
      isSystemAdmin: false,
    });

    render(<Navigation />);

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('renders nothing when auth state is loading', () => {
    vi.mocked(useAuthState).mockReturnValue(undefined);

    render(<Navigation />);

    // Should not render login button or user menu
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });
});
