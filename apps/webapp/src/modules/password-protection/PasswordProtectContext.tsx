'use client';

import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { verifyPassword } from './password-utils';

export interface PasswordProtectConfig {
  verifyHash: string;
  salt: string;
  localStorageKey: string;
}

export interface PasswordProtectContextValue {
  isAuthorized: boolean;
  isLoading: boolean;
  error: string;
  authenticate: (password: string) => Promise<boolean>;
  logout: () => void;
  temporarilyHide: () => void;
  unhide: () => void;
  isTemporarilyHidden: boolean;
}

const PasswordProtectContext = createContext<PasswordProtectContextValue | null>(null);

export interface PasswordProtectProviderProps {
  config: PasswordProtectConfig;
  children: React.ReactNode;
}

export function PasswordProtectProvider({ config, children }: PasswordProtectProviderProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTemporarilyHidden, setIsTemporarilyHidden] = useState(false);
  const [error, setError] = useState('');

  const { verifyHash, salt, localStorageKey } = config;

  // Check localStorage on mount for existing valid password
  useEffect(() => {
    const checkStoredPassword = async () => {
      try {
        const storedPassword = localStorage.getItem(localStorageKey);
        if (storedPassword) {
          const isValid = await verifyPassword(storedPassword, verifyHash, salt);
          if (isValid) {
            setIsAuthorized(true);
          } else {
            // Remove invalid stored password
            localStorage.removeItem(localStorageKey);
          }
        }
      } catch (err) {
        console.error('Error checking stored password:', err);
        // Remove potentially corrupted stored password
        localStorage.removeItem(localStorageKey);
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredPassword();
  }, [localStorageKey, verifyHash, salt]);

  const authenticate = useCallback(
    async (password: string): Promise<boolean> => {
      setIsLoading(true);
      setError('');

      try {
        const isValid = await verifyPassword(password, verifyHash, salt);
        if (isValid) {
          // Store the password in localStorage
          localStorage.setItem(localStorageKey, password);
          setIsAuthorized(true);
          return true;
        }

        setError('Incorrect password. Please try again.');
        return false;
      } catch (err) {
        setError('An error occurred while verifying the password.');
        console.error('Password verification error:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [verifyHash, salt, localStorageKey]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(localStorageKey);
    setIsAuthorized(false);
    setIsTemporarilyHidden(false);
    setError('');
  }, [localStorageKey]);

  const temporarilyHide = useCallback(() => {
    setIsTemporarilyHidden(true);
  }, []);

  const unhide = useCallback(() => {
    setIsTemporarilyHidden(false);
  }, []);

  const contextValue: PasswordProtectContextValue = {
    isAuthorized,
    isLoading,
    error,
    authenticate,
    logout,
    temporarilyHide,
    unhide,
    isTemporarilyHidden,
  };

  return (
    <PasswordProtectContext.Provider value={contextValue}>
      {children}
    </PasswordProtectContext.Provider>
  );
}

export function usePasswordProtection(): PasswordProtectContextValue {
  const context = useContext(PasswordProtectContext);
  if (!context) {
    throw new Error('usePasswordProtection must be used within a PasswordProtectProvider');
  }
  return context;
}
