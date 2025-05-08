'use client';

import { FinancialOverview } from '@/components/FinancialOverview';
import { RecentSharesList } from '@/components/RecentSharesList';
import { TransactionModal } from '@/components/TransactionModal';
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { RequireLogin } from '@/modules/auth/RequireLogin';
import Link from 'next/link';
import { useState } from 'react';

export default function AppPage() {
  const authState = useAuthState();

  // Shared date state for the financial view
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Handler for when transaction is added
  const handleTransactionAdded = () => {
    // Refresh the financial overview
    setSelectedDate(new Date(selectedDate.getTime()));
  };

  return (
    <RequireLogin>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
              <div className="flex gap-2">
                <TransactionModal
                  buttonLabel="Add Transaction"
                  onSuccess={handleTransactionAdded}
                />
                <Link href="/app/profile">
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {authState?.state === 'authenticated' && (
            <div className="space-y-6 sm:space-y-8">
              {authState.user.type === 'anonymous' && (
                <div
                  className="p-3 rounded border"
                  style={{
                    backgroundColor: 'var(--tip-bg)',
                    color: 'var(--tip-text)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <p className="text-sm">
                    <span className="font-semibold">Tip:</span> You're using an anonymous account.
                    Visit your{' '}
                    <Link href="/profile" className="underline hover:opacity-80">
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
                      buttonLabel="Add New Transaction"
                      className="w-full justify-start"
                      onSuccess={handleTransactionAdded}
                    />
                    <Link href="/budgets" className="block">
                      <Button variant="outline" size="sm" className="w-full justify-start">
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
          )}
        </div>
      </div>
    </RequireLogin>
  );
}
