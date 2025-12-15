'use client';
import { api } from '@workspace/backend/convex/_generated/api';
import type { AuthState } from '@workspace/backend/modules/auth/types/AuthState';
import { SessionProvider, type UseStorage, useSessionQuery } from 'convex-helpers/react/sessions';
import type { SessionId } from 'convex-helpers/server/sessions';
import { createContext, useContext, useEffect, useState } from 'react';

import { generateUUID } from '@/lib/utils';

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Provides authentication context to the application with session management.
 */
export const AuthProvider = _withSessionProvider(({ children }: { children: React.ReactNode }) => {
  // Get the backend validation of what the auth state is
  const authState = useSessionQuery(api.auth.getState);
  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
});

/**
 * Hook to access the current authentication state.
 */
export const useAuthState = () => {
  const authState = useContext(AuthContext);
  return authState;
};

/**
 * Hook to access the current authenticated user, returning undefined if not authenticated.
 */
export const useCurrentUser = () => {
  const authState = useAuthState();
  return authState?.state === 'authenticated' ? authState.user : undefined;
};

/**
 * Higher-order component that wraps components with session provider functionality.
 */
function _withSessionProvider(Component: React.ComponentType<{ children: React.ReactNode }>) {
  return (props: { children: React.ReactNode }) => {
    return (
      <SessionProvider
        storageKey="sessionId"
        useStorage={useLocalStorageSession}
        idGenerator={generateUUID}
      >
        <Component {...props} />
      </SessionProvider>
    );
  };
}

/**
 * Custom local storage hook for session management that handles client-side hydration.
 */
const useLocalStorageSession = (
  key: string,
  nextSessionId: SessionId | undefined
): ReturnType<UseStorage<SessionId | undefined>> => {
  const [sessionId, setSessionId] = useState<SessionId>('' as string & { __SessionId: true });

  useEffect(() => {
    // Run only on the client
    const prevSessionId = localStorage.getItem(key) as SessionId | null;
    if (prevSessionId == null) {
      if (nextSessionId) {
        // No last session, create a new one and mark it has started
        localStorage.setItem(key, nextSessionId);
        setSessionId(nextSessionId); // If local storage has value, use it instead of the one passed in
      } else {
        // There is no next session id, do nothing
      }
    } else {
      setSessionId(prevSessionId); // Load the previous session
    }
  }, [key, nextSessionId]);

  const set = (_val: SessionId | undefined) => {
    // Do nothing - this doesn't seem to be called
  };

  return [
    sessionId, // The value returned here will be used as the source of truth
    (v: SessionId | undefined) => {
      set(v);
    },
  ] satisfies [SessionId | null, (value: SessionId) => void];
};
