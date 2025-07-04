import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { CoinsIcon, PieChartIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SpendingBreakdownChart } from './CategoryPieChart';
import { MonthYearPicker } from './MonthYearPicker';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface SpendingGraphProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  showDatePicker?: boolean;
  readOnly?: boolean;
}

export function SpendingGraph({
  selectedDate,
  onDateChange,
  showDatePicker = true,
  readOnly = false,
}: SpendingGraphProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<'allocation' | 'expenses'>('allocation');

  // Extract year and month (0-based) from selected date - memoize to prevent recalculation
  const { year, month } = useMemo(
    () => ({
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth(),
    }),
    [selectedDate]
  );

  // Get the client's timezone offset in minutes
  const timezoneOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);

  // Fetch data for expenses
  const expenses = useSessionQuery(api.transactions.getCategorySummary, {
    year,
    month,
    transactionType: 'expense',
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Fetch savings data
  const savingsSummary = useSessionQuery(api.transactions.getSavingsSummary, {
    year,
    month,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Fetch budget data
  const budgetData = useSessionQuery(api.budgets.getTotalBudgetSummary, {
    year,
    month,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Fetch budget details for categories
  const budgetDetails = useSessionQuery(api.budgets.getBudgetProgress, {
    year,
    month,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Fetch monthly summary data for income
  const monthlySummary = useSessionQuery(api.transactions.getMonthlyFinancialSummary, {
    year,
    month,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Loading state
  const isLoading =
    expenses === undefined ||
    savingsSummary === undefined ||
    budgetData === undefined ||
    monthlySummary === undefined ||
    budgetDetails === undefined;

  // Calculate unallocated funds
  const unallocatedFunds = useMemo(() => {
    if (!monthlySummary || !budgetData || !savingsSummary) return 0;
    return Math.max(
      0,
      monthlySummary.totalIncome - savingsSummary.netSavings - budgetData.totalBudget
    );
  }, [monthlySummary, budgetData, savingsSummary]);

  // Prepare fund allocation data
  const allocationData = useMemo(() => {
    if (!budgetData || !savingsSummary || !budgetDetails) return [];

    // Extract budget categories from the budgetDetails
    const budgetCategories = budgetDetails.budgeted.map((budget) => ({
      category: budget.category,
      amount: budget.amount,
      percentage: 0, // Will be calculated by the chart component
    }));

    const data = [
      // Only include savings if there are any
      ...(savingsSummary.netSavings > 0
        ? [
            {
              category: 'Savings',
              amount: savingsSummary.netSavings,
              percentage: 0, // Will be calculated by the chart component
            },
          ]
        : []),
      ...budgetCategories,
    ];

    // Only include unallocated if there are any
    if (unallocatedFunds > 0) {
      data.push({
        category: 'Unallocated',
        amount: unallocatedFunds,
        percentage: 0, // Will be calculated by the chart component
      });
    }

    return data;
  }, [budgetData, savingsSummary, unallocatedFunds, budgetDetails]);

  // Calculate total allocated funds
  const totalAllocated = useMemo(() => {
    if (!allocationData.length) return 0;
    return allocationData.reduce((sum, item) => sum + item.amount, 0);
  }, [allocationData]);

  return (
    <div>
      {showDatePicker && (
        <div className="mb-4">
          <MonthYearPicker value={selectedDate} onChange={onDateChange} disabled={readOnly} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="mb-4">
          <Tabs
            defaultValue="allocation"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'allocation' | 'expenses')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger
                value="allocation"
                className="flex items-center gap-1"
                disabled={readOnly}
              >
                <CoinsIcon className="h-4 w-4" />
                <span>Fund Allocation</span>
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex items-center gap-1" disabled={readOnly}>
                <PieChartIcon className="h-4 w-4" />
                <span>Expenses</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="allocation" className="p-4 border rounded-md">
              {monthlySummary && monthlySummary.totalIncome <= 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <p>No income recorded for this month.</p>
                  <p className="text-sm mt-2">
                    Add income transactions to see your fund allocation.
                  </p>
                </div>
              ) : allocationData.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <p>No budgets or savings for this month.</p>
                  <p className="text-sm mt-2">Set up your budget to see your fund allocation.</p>
                </div>
              ) : (
                <SpendingBreakdownChart
                  data={allocationData}
                  totalSpent={totalAllocated}
                  year={year}
                  month={month}
                  showBudgetComparison={false}
                  includeSavings={false}
                  title="Fund Allocation"
                />
              )}
            </TabsContent>

            <TabsContent value="expenses" className="p-4 border rounded-md">
              {expenses && expenses.categories.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <p>No expenses recorded for this month.</p>
                  <p className="text-sm mt-2">
                    Add expense transactions to see your spending breakdown.
                  </p>
                </div>
              ) : (
                <SpendingBreakdownChart
                  data={expenses?.categories || []}
                  totalSpent={expenses?.totalSpent || 0}
                  year={year}
                  month={month}
                  showBudgetComparison={true}
                  includeSavings={false}
                  title="Expenses by Category"
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
