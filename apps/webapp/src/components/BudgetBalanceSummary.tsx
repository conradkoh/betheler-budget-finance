import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { AlertTriangleIcon, CheckCircleIcon, Loader2Icon, PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';
import { BudgetForm } from './BudgetForm';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface BudgetBalanceSummaryProps {
  year: number;
  month: number;
}

export function BudgetBalanceSummary({ year, month }: BudgetBalanceSummaryProps) {
  const [isAddingBudget, setIsAddingBudget] = useState(false);

  // Get the client's timezone offset in minutes
  const timezoneOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);

  // Fetch financial summary data
  const summary = useSessionQuery(api.transactions.getMonthlyFinancialSummary, {
    year,
    month,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Fetch budget summary data
  const budgetSummary = useSessionQuery(api.budgets.getTotalBudgetSummary, {
    year,
    month,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Handle dialog close after successful budget creation
  const handleBudgetCreated = () => {
    setIsAddingBudget(false);
  };

  // Handle open add budget dialog
  const handleOpenAddBudget = () => {
    setIsAddingBudget(true);
  };

  // Loading state
  if (summary === undefined || budgetSummary === undefined) {
    return (
      <div className="mb-6 p-4 flex justify-center items-center border rounded bg-card">
        <div className="flex items-center gap-2">
          <Loader2Icon className="h-5 w-5 animate-spin" />
          <span>Loading budget balance data...</span>
        </div>
      </div>
    );
  }

  // Extract the data
  const { totalSpendableIncome, totalIncome, totalSavings } = summary;
  const { totalBudget } = budgetSummary;

  // Check if budget is balanced
  const isBalanced = Math.abs(totalBudget - totalSpendableIncome) < 0.01;

  // Difference between budget and spendable income
  const difference = Math.abs(totalBudget - totalSpendableIncome);

  // Is budget more or less than spendable income
  const budgetIsHigher = totalBudget > totalSpendableIncome;

  // Return the component with conditional rendering based on budget balance
  return (
    <div className="mb-6">
      {/* Add Budget Dialog - moved outside conditionals so it can be triggered from anywhere */}
      <Dialog open={isAddingBudget} onOpenChange={setIsAddingBudget}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Budget</DialogTitle>
            <DialogDescription>
              Set a budget for a spending category for this month
            </DialogDescription>
          </DialogHeader>
          <BudgetForm year={year} month={month} onSuccess={handleBudgetCreated} />
        </DialogContent>
      </Dialog>

      {isBalanced ? (
        <div className="p-5 bg-success-bg border border-success/20 rounded">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-base text-success font-medium">Your budget is balanced!</p>
              <p className="text-sm text-success/90 mt-1">
                You've budgeted {formatCurrency(totalBudget)} for this month, which matches your
                spendable income of {formatCurrency(totalSpendableIncome)}.
              </p>
            </div>
          </div>
        </div>
      ) : totalBudget === 0 ? (
        <div className="p-5 bg-info-bg border border-info/20 rounded">
          <div className="flex flex-col items-center text-center">
            <AlertTriangleIcon className="h-6 w-6 text-info mb-2" />
            <p className="text-base text-info font-medium">Start budgeting your income</p>
            <div className="mt-2 mb-3">
              <span className="text-xl font-bold text-info">
                {formatCurrency(totalSpendableIncome)}
              </span>
              <span className="text-sm text-info/80 ml-2">available to budget</span>
            </div>
            <p className="text-sm text-info/80 max-w-md mb-4">
              Add budget categories to start tracking your spending.
            </p>
            <Button
              onClick={handleOpenAddBudget}
              variant="outline"
              className="bg-info text-info-foreground hover:bg-info/90"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Your First Budget
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-warning-bg border border-warning/20 rounded">
          {/* Top section with warning icon and header */}
          <div className="flex items-center justify-center mb-3">
            <AlertTriangleIcon className="h-6 w-6 text-warning mr-2" />
            <p className="text-base text-warning font-medium">Your budget is not balanced</p>
          </div>

          {/* Centered prominent amount display */}
          <div className="flex flex-col items-center text-center mb-4">
            <span
              className={cn('text-2xl font-bold', budgetIsHigher ? 'text-error' : 'text-warning')}
            >
              {formatCurrency(difference)}
            </span>
            <span className="text-sm text-warning/80">
              {budgetIsHigher ? 'over your available income' : 'left to budget'}
            </span>
          </div>

          {/* Budget Summary - centered with max width */}
          <div className="mx-auto max-w-md bg-background/60 p-3 rounded border border-warning/20">
            <p className="text-xs text-warning font-semibold uppercase tracking-wide mb-2 text-center">
              Budget Summary
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-warning/90">Total Income:</div>
              <div className="text-right font-medium text-warning">
                {formatCurrency(totalIncome)}
              </div>

              <div className="text-warning/90">Total Savings:</div>
              <div className="text-right font-medium text-warning">
                {formatCurrency(totalSavings)}
              </div>

              <div className="text-warning/90 font-medium">Available to Budget:</div>
              <div className="text-right font-medium text-warning">
                {formatCurrency(totalSpendableIncome)}
              </div>

              <div className="text-warning/90">Currently Budgeted:</div>
              <div className="text-right font-medium text-warning">
                {formatCurrency(totalBudget)}
              </div>

              <div className="border-t border-warning/20 col-span-2 mt-1 pt-1" />

              <div className="text-warning font-semibold">Remaining to Budget:</div>
              <div
                className={cn(
                  'text-right font-bold',
                  budgetIsHigher ? 'text-error' : 'text-warning'
                )}
              >
                {budgetIsHigher ? `${formatCurrency(difference)} over` : formatCurrency(difference)}
              </div>
            </div>
          </div>

          {/* Suggestion and Add Budget button - centered */}
          <div className="mt-4 text-center">
            <p className="text-xs text-warning/80 mb-3">
              {budgetIsHigher
                ? 'Consider adding more to savings or reducing some budget categories.'
                : 'Add or increase budget categories to allocate all of your income.'}
            </p>
            {!budgetIsHigher && (
              <Button
                onClick={handleOpenAddBudget}
                size="sm"
                variant="default"
                className="bg-warning text-warning-foreground hover:bg-warning/90"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Budget
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
