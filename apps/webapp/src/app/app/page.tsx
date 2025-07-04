'use client';

import { LayoutGrid, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { FinancialOverview } from '@/components/FinancialOverview';
import { TransactionModal } from '@/components/TransactionModal';
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { RequireLogin } from '@/modules/auth/RequireLogin';

/**
 * Displays the main application dashboard with user-specific content and navigation.
 */
export default function AppPage() {
  const authState = useAuthState();

  // Shared date state for the financial view
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isAuthenticated = authState?.state === 'authenticated';
  const isAnonymousUser = useMemo(() => {
    return isAuthenticated && authState.user.type === 'anonymous';
  }, [isAuthenticated, authState]);

  // Handler for when transaction is added
  const handleTransactionAdded = useCallback(() => {
    // Refresh the financial overview
    setSelectedDate(new Date(selectedDate.getTime()));
  }, [selectedDate]);

  const dashboardContent = useMemo(() => {
    if (!isAuthenticated) return null;

    return (
      <div className="space-y-6 sm:space-y-8">
        {isAnonymousUser && (
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Tip:</span> You're using an anonymous account. Visit
              your{' '}
              <Link href="/app/profile" className="text-blue-600 underline hover:text-blue-800">
                profile page
              </Link>{' '}
              to personalize your display name.
            </p>
          </div>
        )}

        {/* Financial Overview */}
        <FinancialOverview
          initialDate={selectedDate}
          onDataChange={() => {
            // Force a refresh of the component by creating a new date object
            setSelectedDate(new Date(selectedDate.getTime()));
          }}
        />

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-md bg-card">
            <h3 className="font-medium mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <TransactionModal
                buttonVariant="outline"
                buttonLabel={
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Transaction
                  </>
                }
                className="w-full justify-start"
                onSuccess={handleTransactionAdded}
              />
              <Link href="/budgets" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Manage Budgets
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-4 border rounded-md bg-card">
            <h3 className="font-medium mb-2">Financial Tips</h3>
            <p className="text-sm text-muted-foreground">
              Track your spending regularly to stay on top of your budget.
            </p>
          </div>
        </div>
      </div>
    );
  }, [isAuthenticated, isAnonymousUser, selectedDate, handleTransactionAdded]);

  return (
    <RequireLogin>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
              <TransactionModal
                buttonLabel={
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </>
                }
                buttonVariant="default"
                className="font-medium shadow-sm hover:shadow-md transition-shadow"
                onSuccess={handleTransactionAdded}
              />
            </div>
          </div>

          {dashboardContent}
        </div>
      </div>
    </RequireLogin>
  );
}
