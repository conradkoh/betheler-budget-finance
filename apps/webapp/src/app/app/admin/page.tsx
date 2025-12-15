'use client';

import { Settings, Shield, Users } from 'lucide-react';
import { useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppInfo } from '@/modules/app/useAppInfo';
import { useAuthState } from '@/modules/auth/AuthProvider';

interface _StatusCardData {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Admin dashboard page displaying system status and configuration overview.
 * Shows app version, Google authentication status, and user access level.
 */
export default function AdminDashboard() {
  const authState = useAuthState();
  const { appInfo, isLoading } = useAppInfo();

  /**
   * Memoized status cards data to prevent unnecessary recalculations.
   */
  const statusCards = useMemo((): _StatusCardData[] => {
    return [
      {
        title: 'App Version',
        value: isLoading ? '...' : appInfo?.version || 'Unknown',
        description: 'Current version',
        icon: <Settings className="h-4 w-4 text-muted-foreground" />,
      },
      {
        title: 'Google Auth',
        value: isLoading ? '...' : appInfo?.googleAuthAvailable ? 'Enabled' : 'Disabled',
        description: isLoading
          ? 'Loading...'
          : appInfo?.googleAuthAvailable
            ? 'Ready for user login'
            : 'Configuration required',
        icon: <Shield className="h-4 w-4 text-muted-foreground" />,
      },
      {
        title: 'Your Access',
        value:
          authState?.state === 'authenticated'
            ? authState.accessLevel === 'system_admin'
              ? 'Admin'
              : 'User'
            : '...',
        description: 'Access level',
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
      },
    ];
  }, [authState, appInfo, isLoading]);

  /**
   * Memoized Google auth status for system information section.
   */
  const googleAuthStatus = useMemo(() => {
    if (isLoading) return { text: 'Loading...', className: 'text-muted-foreground' };

    if (appInfo?.googleAuthAvailable) {
      return { text: 'Active', className: 'text-green-600 dark:text-green-400' };
    }

    if (appInfo?.googleAuthDetails.isConfiguredInDatabase) {
      return { text: 'Disabled', className: 'text-yellow-600 dark:text-yellow-400' };
    }

    return { text: 'Unconfigured', className: 'text-red-600 dark:text-red-400' };
  }, [appInfo, isLoading]);

  return (
    <div className="pt-6 space-y-4 md:space-y-6">
      {_renderHeader()}
      {_renderStatusOverview(statusCards)}
      {_renderSystemInformation(googleAuthStatus)}
    </div>
  );
}

/**
 * Renders the dashboard header section.
 */
function _renderHeader() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-sm md:text-base text-muted-foreground">
        System administration and configuration panel
      </p>
    </div>
  );
}

/**
 * Renders the status overview cards grid.
 */
function _renderStatusOverview(statusCards: _StatusCardData[]) {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statusCards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl md:text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Renders the system information section.
 */
function _renderSystemInformation(googleAuthStatus: { text: string; className: string }) {
  return (
    <div className="space-y-3 md:space-y-4">
      <h2 className="text-lg md:text-xl font-semibold">System Information</h2>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Environment Status</CardTitle>
          <CardDescription className="text-sm">
            Current system configuration details
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="font-medium">Google Authentication:</span>
              <span className={googleAuthStatus.className}>{googleAuthStatus.text}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
