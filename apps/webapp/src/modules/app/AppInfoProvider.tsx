'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { createContext, type ReactNode, useMemo } from 'react';

/**
 * App Info data structure from the backend
 */
export interface AppInfo {
  version: string;
  googleAuthAvailable: boolean;
  googleAuthDetails: {
    isConfiguredInDatabase: boolean;
    isEnabled: boolean;
    hasClientId: boolean;
    hasClientSecret: boolean;
  };
}

/**
 * Context value interface including loading and error states
 */
export interface AppInfoContextValue {
  appInfo: AppInfo | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * App Info Context
 */
export const AppInfoContext = createContext<AppInfoContextValue | undefined>(undefined);

/**
 * Props for the AppInfoProvider component
 */
export interface AppInfoProviderProps {
  children: ReactNode;
}

/**
 * App Info Provider component that fetches and provides app configuration data
 * to all child components through React Context.
 */
export function AppInfoProvider({ children }: AppInfoProviderProps) {
  // Fetch app info from backend
  const appInfoQuery = useQuery(api.appinfo.get);

  /**
   * Memoized context value to prevent unnecessary re-renders.
   */
  const contextValue = useMemo((): AppInfoContextValue => {
    const isLoading = appInfoQuery === undefined;
    const error = null; // Convex handles errors internally, we could extend this if needed

    return {
      appInfo: appInfoQuery || null,
      isLoading,
      error,
      refetch: _refetch,
    };
  }, [appInfoQuery]);

  return <AppInfoContext.Provider value={contextValue}>{children}</AppInfoContext.Provider>;
}

/**
 * Refetch function for interface consistency.
 * In Convex, queries automatically refetch, but we provide this for interface consistency.
 */
function _refetch(): void {
  // Convex queries automatically refetch, but we could implement manual refetch logic here if needed
  // For now, this is mainly for interface consistency
}
