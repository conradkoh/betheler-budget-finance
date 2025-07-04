'use client';

import { RequireLogin } from '@/modules/auth/RequireLogin';

/**
 * Displays the main application layout with authentication requirement for all child routes.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RequireLogin>{children}</RequireLogin>;
}
