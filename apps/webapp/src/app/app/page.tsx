'use client';

import { FinancialOverview } from '@/components/FinancialOverview';
import { RecentSharesList } from '@/components/RecentSharesList';
import { TransactionModal } from '@/components/TransactionModal';
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { RequireLogin } from '@/modules/auth/RequireLogin';
import { LayoutGrid, Plus } from 'lucide-react';
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

          {authState?.state === 'authenticated' && (
            <div className="space-y-6 sm:space-y-8">
              {authState.user.type === 'anonymous' && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Tip:</span> You're using an anonymous account.
                    Visit your{' '}
                    <Link
                      href="/app/profile"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
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
          )}
        </div>
      </div>
    </RequireLogin>
  );
}
