import { formatCurrency } from '@/lib/formatCurrency';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { AlertTriangleIcon, CheckCircleIcon, Loader2Icon, PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
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
        <div
          className="p-5 rounded"
          style={{
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
          }}
        >
          <div className="flex items-start gap-3">
            <CheckCircleIcon
              className="h-6 w-6 flex-shrink-0 mt-0.5"
              style={{ color: 'var(--success-text)' }}
            />
            <div>
              <p className="text-base font-medium" style={{ color: 'var(--success-text)' }}>
                Your budget is balanced!
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--success-text)' }}>
                You've budgeted {formatCurrency(totalBudget)} for this month, which matches your
                spendable income of {formatCurrency(totalSpendableIncome)}.
              </p>
            </div>
          </div>
        </div>
      ) : totalBudget === 0 ? (
        <div
          className="p-5 rounded-xl"
          style={{
            backgroundColor: 'var(--tip-bg)',
            border: '1px solid var(--info-border)',
          }}
        >
          <div className="flex flex-col items-center text-center">
            <AlertTriangleIcon className="h-6 w-6 mb-2" style={{ color: 'var(--info-text)' }} />
            <p className="text-base font-medium" style={{ color: 'var(--info-text)' }}>
              Start budgeting your income
            </p>
            <div className="mt-2 mb-3">
              <span className="text-xl font-bold" style={{ color: 'var(--info-text)' }}>
                {formatCurrency(totalSpendableIncome)}
              </span>
              <span className="text-sm ml-2" style={{ color: 'var(--info-text)' }}>
                available to budget
              </span>
            </div>
            <p className="text-sm max-w-md mb-4" style={{ color: 'var(--info-text)' }}>
              Add budget categories to start tracking your spending.
            </p>
            <Button
              onClick={handleOpenAddBudget}
              style={{
                backgroundColor: 'var(--info-text)',
                color: 'var(--info-bg)',
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Your First Budget
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="p-5 rounded-xl"
          style={{
            backgroundColor: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
          }}
        >
          <div className="flex items-center justify-center mb-3">
            <AlertTriangleIcon className="h-6 w-6 mr-2" style={{ color: 'var(--warning-icon)' }} />
            <p className="text-base font-medium" style={{ color: 'var(--warning-text-2)' }}>
              Your budget is not balanced
            </p>
          </div>

          <div className="flex flex-col items-center text-center mb-4">
            <span
              className="text-2xl font-bold"
              style={{
                color: budgetIsHigher ? 'var(--remaining-negative)' : 'var(--warning-text)',
              }}
            >
              {formatCurrency(difference)}
            </span>
            <span className="text-sm" style={{ color: 'var(--warning-text)' }}>
              {budgetIsHigher ? 'over your available income' : 'left to budget'}
            </span>
          </div>

          <div
            className="mx-auto max-w-md p-3 rounded-lg border"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--warning-border)',
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2 text-center"
              style={{ color: 'var(--warning-text)' }}
            >
              Budget Summary
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div style={{ color: 'var(--warning-text-2)' }}>Total Income:</div>
              <div className="text-right font-medium" style={{ color: 'var(--warning-text-2)' }}>
                {formatCurrency(totalIncome)}
              </div>

              <div style={{ color: 'var(--warning-text-2)' }}>Total Savings:</div>
              <div className="text-right font-medium" style={{ color: 'var(--warning-text-2)' }}>
                {formatCurrency(totalSavings)}
              </div>

              <div className="font-medium" style={{ color: 'var(--warning-text-2)' }}>
                Available to Budget:
              </div>
              <div className="text-right font-medium" style={{ color: 'var(--warning-text-2)' }}>
                {formatCurrency(totalSpendableIncome)}
              </div>

              <div style={{ color: 'var(--warning-text-2)' }}>Currently Budgeted:</div>
              <div className="text-right font-medium" style={{ color: 'var(--warning-text-2)' }}>
                {formatCurrency(totalBudget)}
              </div>

              <div
                className="border-t col-span-2 mt-1 pt-1"
                style={{ borderColor: 'var(--warning-border)' }}
              />

              <div className="font-semibold" style={{ color: 'var(--warning-text-2)' }}>
                {budgetIsHigher ? 'Over Budget By:' : 'Remaining to Budget:'}
              </div>
              <div
                className="text-right font-bold"
                style={{
                  color: 'var(--remaining-negative)',
                }}
              >
                {formatCurrency(difference)}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs mb-3" style={{ color: 'var(--warning-text-2)' }}>
              {budgetIsHigher
                ? 'Consider adding more to savings or reducing some budget categories.'
                : 'Add or increase budget categories to allocate all of your income.'}
            </p>
            {!budgetIsHigher && (
              <Button
                onClick={handleOpenAddBudget}
                size="sm"
                style={{
                  backgroundColor: 'var(--warning-icon)',
                  color: 'var(--warning-bg)',
                }}
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
