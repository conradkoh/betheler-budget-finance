import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/app/ConvexClientProvider';
import { Navigation } from '@/components/Navigation';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/modules/auth/AuthProvider';
import { ThemeProvider } from '@/modules/theme/ThemeProvider';
import type { Theme } from '@/modules/theme/theme-utils';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Budget',
  description: 'Budgeting and financial management application for Bethel ER',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Budget',
  },
  applicationName: 'Budget',
  formatDetection: {
    telephone: false,
  },
};

// Minimal script for theme flash prevention
const themeScript = `
(() => {
  window.__theme = {
    value: localStorage.getItem('theme') || 'system',
    onThemeChange: () => {
      const theme = window.__theme.value;
      let nextTheme = theme;
      // we interpret system theme to be the actual theme value for the transition
      if (nextTheme === 'system') {
        nextTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      switch (nextTheme) {
        case 'dark': {
          document.documentElement.classList.add('dark');
          document.documentElement.style.backgroundColor = 'var(--background)';
          break;
        }
        case 'light': {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.backgroundColor = 'var(--background)';
          break;
        }
      }
    },
    /**
     * @param {'light' | 'dark' | 'system'} theme - The theme to set.
     * @description Sets the theme and updates the document background color.
     */
    setTheme: (theme) => {
      if (theme == null) {
        return;
      }
      // set the window values and persist
      window.__theme.value = theme;
      localStorage.setItem('theme', theme);

      // trigger the update
      window.__theme.onThemeChange();
    },
    init: () => {
      const theme = window.__theme.value;
      window.__theme.setTheme(theme);
    },
  };

  window.__theme.init(); //trigger the initial theme

  // listen to updates from the system
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', window.__theme.onThemeChange);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/appicon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConvexClientProvider>
          <AuthProvider>
            <ThemeProvider>
              <div className="flex flex-col h-screen overflow-hidden">
                <Navigation />
                <main className="flex-1 flex flex-col overflow-scroll">{children}</main>
              </div>
            </ThemeProvider>
          </AuthProvider>
        </ConvexClientProvider>
        <Toaster />
      </body>
    </html>
  );
}

declare global {
  interface Window {
    __theme: {
      value: Theme;
      onThemeChange: () => void;
      setTheme: (theme: Theme) => void;
    };
  }
}
