import { useContext } from 'react';

import { AppInfoContext, type AppInfoContextValue } from './AppInfoProvider';

/**
 * Custom hook for consuming app info context.
 * Provides access to app configuration data throughout the application.
 *
 * @throws Error if used outside of AppInfoProvider
 * @returns AppInfoContextValue containing app info, loading state, error state, and refetch function
 */
export function useAppInfo(): AppInfoContextValue {
  const context = useContext(AppInfoContext);

  if (context === undefined) {
    throw new Error('useAppInfo must be used within an AppInfoProvider');
  }

  return context;
}

/**
 * Hook to get just the Google Auth availability status.
 * Convenience hook for components that only need to check if Google Auth is available.
 *
 * @returns boolean indicating if Google Auth is available, null if loading
 */
export function useGoogleAuthAvailable(): boolean | null {
  const { appInfo, isLoading } = useAppInfo();

  if (isLoading || !appInfo) {
    return null;
  }

  return appInfo.googleAuthAvailable;
}

/**
 * Hook to get the app version.
 * Convenience hook for components that only need the app version.
 *
 * @returns string with app version, null if loading
 */
export function useAppVersion(): string | null {
  const { appInfo, isLoading } = useAppInfo();

  if (isLoading || !appInfo) {
    return null;
  }

  return appInfo.version;
}
