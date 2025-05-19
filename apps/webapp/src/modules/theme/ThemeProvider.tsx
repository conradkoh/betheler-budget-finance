'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Theme } from './theme-utils';

type ThemeProviderProps = {
  children: React.ReactNode;
  /**
   * Optional CSS selector to apply the theme class to, rather than the html element.
   * Use for testing alternative theme application strategies.
   */
  targetSelector?: string;
};

type ThemeContextData = {
  setTheme: (theme: Theme) => void;
  theme: Theme | null;
};

const ThemeContext = createContext<ThemeContextData | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children, targetSelector }: ThemeProviderProps) {
  // Custom attribute to use for theme application
  const attribute = targetSelector ? 'data-theme' : 'class';
  // Only render the provider client-side to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [theme, _setTheme] = useState<Theme | null>(null);
  const setTheme = useCallback((theme: Theme) => {
    _setTheme(theme);
    window.__theme.setTheme(theme);
  }, []);

  useEffect(() => {
    // Set mounted state to indicate hydration is complete
    setMounted(true);
    // Sync the theme from the window object to the react state
    _setTheme(window.__theme.value);
  }, []);

  // We need to use this component pattern for hydration safety
  return (
    <>
      {/* Inject script to handle theme before React hydration */}

      {mounted ? (
        <ThemeContext.Provider value={{ theme, setTheme }}>
          <NextThemesProvider
            attribute={attribute}
            defaultTheme="system"
            enableSystem
            themes={['light', 'dark']}
            enableColorScheme
            storageKey="theme"
            // If a target selector is provided, use it as the element to apply theme to
            {...(targetSelector && { selector: targetSelector })}
          >
            {children}
          </NextThemesProvider>
        </ThemeContext.Provider>
      ) : (
        // During SSR and before hydration, just render children
        // The script above will handle theme application
        children
      )}
    </>
  );
}
