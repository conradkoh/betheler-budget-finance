import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/app/ConvexClientProvider';
import { Navigation } from '@/components/Navigation';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/modules/auth/AuthProvider';
import { ThemeProvider } from '@/modules/theme/ThemeProvider';
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
  (function() {
    try {
      // Get stored theme or use system preference
      const storedTheme = localStorage.getItem('theme');
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const theme = storedTheme === 'system' ? systemTheme : storedTheme || systemTheme;
      
      // Apply theme immediately before any rendering
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Set background color based on theme to avoid white flash
      document.documentElement.style.backgroundColor = 
        theme === 'dark' ? 'rgb(9, 9, 11)' : 'rgb(255, 255, 255)';
    } catch (e) {
      // Fallback to system preference if localStorage is not available
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.backgroundColor = 'rgb(9, 9, 11)';
      }
    }
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
              <div className="flex flex-col max-h-screen overflow-hidden">
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
