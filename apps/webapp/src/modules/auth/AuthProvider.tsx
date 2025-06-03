'use client';
import { generateUUID } from '@/lib/utils';
import { api } from '@workspace/backend/convex/_generated/api';
import type { AuthState } from '@workspace/backend/modules/auth/types/AuthState';
import { SessionProvider, type UseStorage, useSessionQuery } from 'convex-helpers/react/sessions';
import type { SessionId } from 'convex-helpers/server/sessions';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = withSessionProvider(({ children }: { children: React.ReactNode }) => {
  //2. get the backend validation of what the auth state is
  const authState = useSessionQuery(api.auth.getState);
  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
});

export const useAuthState = () => {
  const authState = useContext(AuthContext);
  return authState;
};

export const useCurrentUser = () => {
  const authState = useAuthState();
  return authState?.state === 'authenticated' ? authState.user : undefined;
};

function withSessionProvider(Component: React.ComponentType<{ children: React.ReactNode }>) {
  return (props: { children: React.ReactNode }) => {
    return (
      <SessionProvider
        storageKey="sessionId"
        useStorage={useLocalStorage}
        idGenerator={generateUUID}
      >
        <Component {...props} />
      </SessionProvider>
    );
  };
}

/**
 * Replacement helper for the use local storage hook that was not working
 * @param key
 * @param nextSessionId
 * @returns
 */
const useLocalStorage = (
  key: string,
  nextSessionId: SessionId | undefined
): ReturnType<UseStorage<SessionId | undefined>> => {
  const [sessionId, setSessionId] = useState<SessionId>('' as string & { __SessionId: true });

  useEffect(() => {
    //run only on the client
    const prevSessionId = localStorage.getItem(key) as SessionId | null;
    if (prevSessionId == null) {
      if (nextSessionId) {
        //no last session, create a new one and mark it has started
        localStorage.setItem(key, nextSessionId);
        setSessionId(nextSessionId); //if local storage has value, use it instead of the one passed in.
      } else {
        //there is no next session id, do nothing
      }
    } else {
      setSessionId(prevSessionId); //load the previous session
    }
  }, [key, nextSessionId]);

  const set = (val: SessionId | undefined) => {
    //do nothing - this doesn't seem to be called
  };
  return [
    sessionId, //the value returned here will be used as the source of truth
    (v: SessionId | undefined) => {
      set(v);
    },
  ] satisfies [SessionId | null, (value: SessionId) => void];
};
