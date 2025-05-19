import { formatCurrency } from '@/lib/formatCurrency';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  DollarSignIcon,
  Loader2Icon,
  PiggyBankIcon,
  PlusIcon,
  WrenchIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { BudgetNavigationButton } from './BudgetNavigationButton';
import { TransactionModal } from './TransactionModal';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
interface MonthlySummaryCardProps {
  selectedDate: Date;
  noCard?: boolean;
  onDataChange?: () => void;
  readOnly?: boolean;
}

export function MonthlySummaryCard({
  selectedDate,
  noCard = false,
  onDataChange,
  readOnly = false,
}: MonthlySummaryCardProps) {
  // Extract year and month from the date
  const { year, month } = useMemo(
    () => ({
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth(),
    }),
    [selectedDate]
  );

  // Get the client's timezone offset in minutes
  const timezoneOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);

  // Fetch the monthly financial summary data
  const summary = useSessionQuery(api.transactions.getMonthlyFinancialSummary, {
    year,
    month,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Fetch budget data to compare with spendable income
  const budgetData = useSessionQuery(api.budgets.getTotalBudgetSummary, {
    year,
    month,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Handler for successful transaction creation
  const handleTransactionSuccess = () => {
    onDataChange?.();
  };

  // Loading state
  if (summary === undefined || budgetData === undefined) {
    return (
      <div className={noCard ? '' : 'bg-card rounded-lg border p-4'}>
        <div className="flex justify-center items-center min-h-[230px]">
          <div className="flex items-center gap-2">
            <Loader2Icon className="h-5 w-5 animate-spin" />
            <span>Loading financial summary...</span>
          </div>
        </div>
      </div>
    );
  }

  // Check if total budget matches spendable income
  const budgetMatchesSpendableIncome =
    Math.abs(budgetData.totalBudget - summary.totalSpendableIncome) < 0.01;

  // Calculate remaining allowance (budget minus actual expenses)
  const remainingAllowance = budgetData.totalBudget - summary.totalExpenses;

  // Calculate the difference between budget and spendable income
  const budgetDifference = Math.abs(budgetData.totalBudget - summary.totalSpendableIncome);

  // Determine if budget is higher or lower than spendable income
  const budgetIsHigher = budgetData.totalBudget > summary.totalSpendableIncome;

  // Check if values are zero for showing quick action buttons
  const hasNoIncome = summary.totalIncome <= 0;
  const hasNoSavings = summary.totalSavings <= 0;
  const hasNoBudget = budgetData.totalBudget <= 0;

  // Whether to show quick action buttons based on both readOnly and data conditions
  const showIncomeButton = !readOnly && hasNoIncome;
  const showSavingsButton = !readOnly && hasNoSavings;

  const content = (
    <div>
      <div className={noCard ? '' : 'pb-2 border-b mb-4'}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">Monthly Summary</h2>
            <div className="text-sm text-muted-foreground">
              {new Date(year, month).toLocaleDateString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
          <DollarSignIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <div className="space-y-6">
        {/* ===== BUDGETING SECTION ===== */}
        <div>
          <h3 className="text-sm font-medium mb-3">Budgeting</h3>
          <div className="space-y-3">
            {/* Income */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ArrowUpIcon className="h-4 w-4" style={{ color: 'var(--income-icon)' }} />
                <span className="font-medium" style={{ color: 'var(--income-text)' }}>
                  {formatCurrency(summary.totalIncome)}
                </span>{' '}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600">
                  {formatCurrency(summary.totalIncome)}
                </span>
                {showIncomeButton && (
                  <TransactionModal
                    buttonVariant="ghost"
                    className="h-7 px-2"
                    onSuccess={handleTransactionSuccess}
                    transactionType="income"
                    category="Income"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <PlusIcon className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Add Income</span>
                      </Button>
                    }
                  />
                )}
              </div>
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
                <ArrowUpIcon className="h-4 w-4" style={{ color: 'var(--income-icon)' }} />
                <span className="font-medium" style={{ color: 'var(--income-text)' }}>
                  {formatCurrency(summary.totalIncome)}
                </span>{' '}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-600">
                  {formatCurrency(summary.totalSavings)}
                </span>
                {showSavingsButton && (
                  <TransactionModal
                    buttonVariant="ghost"
                    className="h-7 px-2"
                    onSuccess={handleTransactionSuccess}
                    transactionType="savings"
                    category="Savings"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <PlusIcon className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Add Savings</span>
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
            {/* Divider with equals indicator */}
            <div className="flex items-center">
              <div className="h-px flex-grow bg-border" />
              <div className="px-2 text-xs text-muted-foreground">equals</div>
              <div className="h-px flex-grow bg-border" />
            </div>
            {/* Spendable Income - Highlighted */}
            <div
              className="flex justify-between items-center p-2 rounded"
              style={{ backgroundColor: 'var(--spendable-bg)' }}
            >
              <span className="text-sm font-semibold">Spendable Income</span>
              <span className="text-xl font-bold" style={{ color: 'var(--spendable-text)' }}>
                {formatCurrency(summary.totalSpendableIncome)}
              </span>
            </div>
            {/* Budget Comparison Warning */}
            {!budgetMatchesSpendableIncome && !hasNoBudget && (
              <div className="flex justify-end gap-2 mt-2">
                {budgetIsHigher ? (
                  <Link
                    href={`/transactions?action=add-savings&amount=${budgetDifference}`}
                    className="inline-flex items-center text-amber-700 hover:text-amber-900 text-xs font-medium gap-1"
                  >
                    <PiggyBankIcon className="h-3 w-3" />
                    Add to Savings
                  </Link>
                ) : (
                  <Link
                    href="/budgets"
                    className="inline-flex items-center text-amber-700 hover:text-amber-900 text-xs font-medium gap-1"
                  >
                    <WrenchIcon className="h-3 w-3" />
                    Adjust Budget
                  </Link>
                )}
              </div>
            )}
            {/* Budget Zero State */}
            {hasNoBudget && (
              <div
                className="mt-1 p-3 rounded text-xs"
                style={{
                  backgroundColor: 'var(--tip-bg)',
                  color: 'var(--info-text)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangleIcon
                    className="h-4 w-4 flex-shrink-0 mt-0.5"
                    style={{ color: 'var(--info-text)' }} // Replacing text-blue-500
                  />
                  <p>
                    You haven't set up your budget for this month. Planning your budget helps you
                    track and manage your spending effectively.
                  </p>
                </div>
                <div className="flex justify-end mt-2">
                  <BudgetNavigationButton className="h-7 text-xs" />
                </div>
              </div>
            )}{' '}
          </div>
        </div>

        {/* Simple separator */}
        <div className="h-px w-full bg-border my-4" />

        {/* ===== REMAINDER SECTION ===== */}
        <div>
          <h3 className="text-sm font-medium mb-3">Spending Tracker</h3>
          <div className="space-y-3">
            {/* Budgeted Amount */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Total Budgeted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(budgetData.totalBudget)}</span>
                {hasNoBudget && <BudgetNavigationButton className="h-7 text-xs px-2" />}
              </div>
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
                <ArrowDownIcon className="h-4 w-4" style={{ color: 'var(--expense-icon)' }} />
                <span className="text-sm" style={{ color: 'var(--expense-text)' }}>
                  Total Expenses
                </span>
              </div>
              <span className="font-medium" style={{ color: 'var(--expense-text)' }}>
                {formatCurrency(summary.totalExpenses)}
              </span>
            </div>
            {/* Divider with equals indicator */}
            <div className="flex items-center">
              <div className="h-px flex-grow bg-border" />
              <div className="px-2 text-xs text-muted-foreground">equals</div>
              <div className="h-px flex-grow bg-border" />
            </div>

            {/* Remaining Allowance - Highlighted */}
            <div
              className="flex justify-between items-center p-2 rounded"
              style={{ backgroundColor: 'var(--spendable-bg)' }}
            >
              <span className="text-sm font-semibold">Remaining Budget</span>
              <span
                className="text-xl font-bold"
                style={{
                  color:
                    remainingAllowance >= 0
                      ? 'var(--remaining-positive)'
                      : 'var(--remaining-negative)',
                }}
              >
                {formatCurrency(Math.abs(remainingAllowance))}
                {remainingAllowance < 0 && ' over'}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    remainingAllowance >= 0
                      ? 'var(--remaining-positive)'
                      : 'var(--remaining-negative)',
                }}
              />
              <span className="text-xs text-muted-foreground">
                {remainingAllowance >= 0
                  ? `You have ${formatCurrency(remainingAllowance)} left to spend this month`
                  : `You've exceeded your budget by ${formatCurrency(Math.abs(remainingAllowance))}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (noCard) {
    return content;
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">{content}</CardContent>
      </Card>
    </>
  );
}
