'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CoinsIcon,
  DollarSignIcon,
  PieChartIcon,
  PiggyBankIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';
import { SpendingBreakdownChart } from './CategoryPieChart';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface SharedFinancialOverviewProps {
  /**
   * Share ID for the shared view
   */
  shareId: string;

  /**
   * Selected date for the financial overview
   */
  selectedDate: Date;

  /**
   * Callback when date changes
   */
  onDateChange: (date: Date) => void;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * A dedicated financial overview component for shared views
 * that uses the sharing API endpoints directly
 */
export function SharedFinancialOverview({
  shareId,
  selectedDate,
  onDateChange: _onDateChange,
  className,
}: SharedFinancialOverviewProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<'allocation' | 'expenses'>('allocation');

  // Extract year and month (0-based) from selected date
  const { year, month } = useMemo(
    () => ({
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth(),
    }),
    [selectedDate]
  );

  // Get the client's timezone offset in minutes
  const timezoneOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);

  // Fetch data using the sharing API endpoints
  const financialSummary = useQuery(api.sharing.getSharedFinancialSummary, {
    shareId,
    month,
    year,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  const budgetSummary = useQuery(api.sharing.getSharedBudgetSummary, {
    shareId,
    month,
    year,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  const expenseCategorySummary = useQuery(api.sharing.getSharedCategorySummary, {
    shareId,
    transactionType: 'expense',
    month,
    year,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  const budgetProgress = useQuery(api.sharing.getSharedBudgetProgress, {
    shareId,
    month,
    year,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  const sharedTransactions = useQuery(api.sharing.getSharedTransactions, {
    shareId,
    month,
    year,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Calculate unallocated funds
  const unallocatedFunds = useMemo(() => {
    if (!financialSummary || financialSummary === null || !budgetSummary || budgetSummary === null)
      return 0;

    return Math.max(
      0,
      financialSummary.totalIncome - financialSummary.totalSavings - budgetSummary.totalBudget
    );
  }, [financialSummary, budgetSummary]);

  // Prepare fund allocation data
  const allocationData = useMemo(() => {
    if (
      !budgetSummary ||
      budgetSummary === null ||
      !budgetProgress ||
      budgetProgress === null ||
      !financialSummary ||
      financialSummary === null
    )
      return [];

    // Extract budget categories from budgetProgress
    const budgetCategories = budgetProgress.budgeted.map((budget) => ({
      category: budget.category,
      amount: budget.amount,
      percentage: 0, // Will be calculated later
    }));

    const data = [
      // Only include savings if there are any
      ...(financialSummary.totalSavings > 0
        ? [
            {
              category: 'Savings',
              amount: financialSummary.totalSavings,
              percentage: 0, // Will be calculated later
            },
          ]
        : []),
      ...budgetCategories,
    ];

    // Only include unallocated funds if there are any
    if (unallocatedFunds > 0) {
      data.push({
        category: 'Unallocated',
        amount: unallocatedFunds,
        percentage: 0, // Will be calculated later
      });
    }

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.amount, 0);

    // Calculate percentages
    for (const item of data) {
      item.percentage = total > 0 ? (item.amount / total) * 100 : 0;
    }

    return data;
  }, [budgetSummary, budgetProgress, financialSummary, unallocatedFunds]);

  // Calculate total allocated funds
  const totalAllocated = useMemo(() => {
    if (!allocationData.length) return 0;
    return allocationData.reduce((sum, item) => sum + item.amount, 0);
  }, [allocationData]);

  // Loading state
  const isLoading =
    financialSummary === undefined ||
    budgetSummary === undefined ||
    expenseCategorySummary === undefined ||
    budgetProgress === undefined ||
    sharedTransactions === undefined;

  // Error state
  const hasError =
    financialSummary === null ||
    budgetSummary === null ||
    expenseCategorySummary === null ||
    budgetProgress === null ||
    sharedTransactions === null;

  // If any data is null (invalid share, expired, etc.)
  if (hasError) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Financial data is not available.</p>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border p-4 sm:p-6 ${className || ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Financial Overview</h2>
      </div>

      {/* Responsive grid layout - stacked on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Summary Section - Left Column */}
        <div>
          <div className="pb-2 border-b mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">Monthly Summary</h2>
                <div className="text-sm text-muted-foreground">
                  {/* Format date using UTC to avoid timezone shifts */}
                  {new Date(Date.UTC(year, month, 1)).toLocaleDateString('default', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <DollarSignIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Budgeting Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Budgeting</h3>
              <div className="space-y-3">
                {/* Income */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ArrowUpIcon className="h-4 w-4 text-success" />
                    <span className="text-sm">Total Income</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <span className="font-medium text-success">
                      {formatCurrency(financialSummary.totalIncome)}
                    </span>
                  )}
                </div>

                {/* Divider with minus indicator */}
                <div className="flex items-center">
                  <div className="h-px flex-grow bg-border" />
                  <div className="px-2 text-xs text-muted-foreground">minus</div>
                  <div className="h-px flex-grow bg-border" />
                </div>

                {/* Savings */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <PiggyBankIcon className="h-4 w-4 text-info" />
                    <span className="text-sm">Total Savings</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <span className="font-medium text-info">
                      {formatCurrency(financialSummary.totalSavings)}
                    </span>
                  )}
                </div>

                {/* Divider with equals indicator */}
                <div className="flex items-center">
                  <div className="h-px flex-grow bg-border" />
                  <div className="px-2 text-xs text-muted-foreground">equals</div>
                  <div className="h-px flex-grow bg-border" />
                </div>

                {/* Spendable Income - Highlighted */}
                <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Spendable Income</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <span className="text-xl font-bold text-black">
                      {formatCurrency(financialSummary.totalSpendableIncome)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Simple separator */}
            <div className="h-px w-full bg-border my-4" />

            {/* Remainder Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Spending Tracker</h3>
              <div className="space-y-3">
                {/* Budgeted Amount */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Budgeted</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <span className="font-medium">{formatCurrency(budgetSummary.totalBudget)}</span>
                  )}
                </div>

                {/* Divider with minus indicator */}
                <div className="flex items-center">
                  <div className="h-px flex-grow bg-border" />
                  <div className="px-2 text-xs text-muted-foreground">minus</div>
                  <div className="h-px flex-grow bg-border" />
                </div>

                {/* Expenses */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ArrowDownIcon className="h-4 w-4 text-error" />
                    <span className="text-sm">Total Expenses</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <span className="font-medium text-error">
                      {formatCurrency(financialSummary.totalExpenses)}
                    </span>
                  )}
                </div>

                {/* Divider with equals indicator */}
                <div className="flex items-center">
                  <div className="h-px flex-grow bg-border" />
                  <div className="px-2 text-xs text-muted-foreground">equals</div>
                  <div className="h-px flex-grow bg-border" />
                </div>

                {/* Remaining Allowance - Highlighted */}
                {/* Calculate remaining allowance (budget minus actual expenses) */}
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Remaining Budget</span>
                      </div>
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-muted" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                ) : (
                  (() => {
                    const remainingAllowance =
                      budgetSummary.totalBudget - financialSummary.totalExpenses;
                    return (
                      <>
                        <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Remaining Budget</span>
                          </div>
                          <span
                            className={cn(
                              'text-xl font-bold',
                              remainingAllowance >= 0 ? '' : 'text-error'
                            )}
                          >
                            {formatCurrency(Math.abs(remainingAllowance))}
                            {remainingAllowance < 0 && ' over'}
                          </span>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              remainingAllowance >= 0 ? 'bg-success' : 'bg-error'
                            )}
                          />
                          <span className="text-xs text-muted-foreground">
                            {remainingAllowance >= 0
                              ? `You have ${formatCurrency(
                                  remainingAllowance
                                )} left to spend this month`
                              : `You've exceeded your budget by ${formatCurrency(
                                  Math.abs(remainingAllowance)
                                )}`}
                          </span>
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Graphs and Charts Section - Right Column */}
        <div className="space-y-6">
          {/* Financial Information Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-success-bg rounded">
              <div className="text-success font-medium">Income</div>
              {isLoading ? (
                <Skeleton className="h-6 w-20 mt-1" />
              ) : (
                <div className="text-success text-lg font-semibold">
                  {formatCurrency(financialSummary.totalIncome)}
                </div>
              )}
            </div>
            <div className="p-3 bg-info-bg rounded">
              <div className="text-info font-medium">Savings</div>
              {isLoading ? (
                <Skeleton className="h-6 w-20 mt-1" />
              ) : (
                <div className="text-info text-lg font-semibold">
                  {formatCurrency(financialSummary.totalSavings)}
                </div>
              )}
            </div>
            <div className="p-3 bg-warning-bg rounded">
              <div className="text-warning font-medium">Budgeted</div>
              {isLoading ? (
                <Skeleton className="h-6 w-20 mt-1" />
              ) : (
                <div className="text-warning text-lg font-semibold">
                  {formatCurrency(budgetSummary.totalBudget)}
                </div>
              )}
            </div>
          </div>

          {/* Charts */}
          <Tabs
            defaultValue="allocation"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'allocation' | 'expenses')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="allocation" className="flex items-center gap-1">
                <CoinsIcon className="h-4 w-4" />
                <span>Fund Allocation</span>
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex items-center gap-1">
                <PieChartIcon className="h-4 w-4" />
                <span>Expenses</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="allocation" className="p-4 border rounded-md">
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
              ) : financialSummary.totalIncome <= 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <p>No income recorded for this month.</p>
                </div>
              ) : allocationData.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <p>No budgets or savings for this month.</p>
                </div>
              ) : (
                <SpendingBreakdownChart
                  data={allocationData}
                  totalSpent={totalAllocated}
                  title="Fund Allocation"
                />
              )}
            </TabsContent>

            <TabsContent value="expenses" className="p-4 border rounded-md">
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
              ) : expenseCategorySummary.categories.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <p>No expense transactions recorded for this month.</p>
                </div>
              ) : (
                <SpendingBreakdownChart
                  data={expenseCategorySummary.categories}
                  totalSpent={expenseCategorySummary.totalSpent}
                  title="Expenses by Category"
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Additional Info */}
          {!isLoading && unallocatedFunds > 0 && (
            <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded">
              <p>
                <span className="font-medium">Unallocated: </span>
                {formatCurrency(unallocatedFunds)} is not assigned to any budget or savings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
