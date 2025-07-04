'use client';
import { api } from '@workspace/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { CalendarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { MonthYearPicker } from './MonthYearPicker';
import { SharedFinancialOverview } from './SharedFinancialOverview';
import { ShareNotFound } from './ShareNotFound';
import { TransactionItem } from './TransactionItem';
import { Skeleton } from './ui/skeleton';

interface SharedTransactionViewProps {
  shareId: string;
}

export function SharedTransactionView({ shareId }: SharedTransactionViewProps) {
  // Date state for month/year selection - shared across all components
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();

  // Get the client's timezone offset in minutes
  const timezoneOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);

  // Fetch shared transactions
  const sharedTransactions = useQuery(api.sharing.getSharedTransactions, {
    shareId,
    month: selectedMonth,
    year: selectedYear,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Check if loading or error
  const isLoading = sharedTransactions === undefined;
  const hasError = sharedTransactions === null;

  // Pre-compute all memoized values
  const expirationDate = useMemo(() => {
    if (!sharedTransactions || sharedTransactions === null) return null;
    const expiryDate = new Date(sharedTransactions.expiresAt);
    return expiryDate.toLocaleDateString();
  }, [sharedTransactions]);

  const formattedMonthYear = useMemo(() => {
    if (!sharedTransactions || sharedTransactions === null) return '';
    // Create a date using UTC values to avoid local timezone shifts during formatting
    const date = new Date(Date.UTC(sharedTransactions.year, sharedTransactions.month, 1));
    return date.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  }, [sharedTransactions]);

  const _total = useMemo(() => {
    if (!sharedTransactions || sharedTransactions === null) return 0;
    return sharedTransactions.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [sharedTransactions]);

  // Add calculations for specific transaction types
  const totalByType = useMemo(() => {
    if (!sharedTransactions || sharedTransactions === null)
      return { income: 0, expense: 0, savings: 0 };

    return sharedTransactions.transactions.reduce(
      (result, tx) => {
        const amount = Math.abs(tx.amount);
        switch (tx.transactionType) {
          case 'income':
            result.income += amount;
            break;
          case 'expense':
            result.expense += amount;
            break;
          case 'savings':
            // For savings, use the actual value (could be positive or negative)
            result.savings += tx.amount;
            break;
        }
        return result;
      },
      { income: 0, expense: 0, savings: 0 }
    );
  }, [sharedTransactions]);

  const netCashFlow = useMemo(() => {
    const { income, expense, savings } = totalByType;
    return income - expense - savings;
  }, [totalByType]);

  const transactionCountMessage = useMemo(() => {
    if (!sharedTransactions || sharedTransactions === null) return '';
    return `(${sharedTransactions.transactions.length} transactions)`;
  }, [sharedTransactions]);

  // If share not found or expired
  if (hasError) {
    return <ShareNotFound />;
  }

  // Create constant keys for skeleton transactions
  const skeletonTransactions = ['a', 'b', 'c', 'd', 'e'];

  return (
    <div className="container py-6 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Financial Dashboard</h1>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <Skeleton className="h-[8px] w-48 mb-1.5" />
            <Skeleton className="h-[10px] w-[250px]" />
          </div>
        ) : (
          <>
            <p className="text-muted-foreground">Shared by {sharedTransactions.userName}</p>
            {!sharedTransactions.permanent && (
              <p className="text-xs text-muted-foreground mt-1">
                This shared view is available until {expirationDate}
              </p>
            )}
          </>
        )}
      </div>

      {/* Month/Year selector at the top level - always visible */}
      <div className="mb-6 bg-muted/30 rounded-lg p-4 border border-border">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <CalendarIcon className="h-4 w-4" />
            <span>Select month to view</span>
          </div>
          <div className="w-full max-w-xs">
            <MonthYearPicker value={selectedDate} onChange={setSelectedDate} />
          </div>
        </div>
      </div>

      {/* Financial Overview - using the dedicated shared component */}
      <SharedFinancialOverview
        shareId={shareId}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        className="mb-8"
      />

      {/* Transactions Summary */}
      <div className="p-4 bg-muted rounded-lg mb-8">
        <div className="flex flex-col">
          <h3 className="text-lg font-medium mb-2">Transactions Summary</h3>
          {isLoading ? (
            <Skeleton className="h-6 w-24 mb-2" />
          ) : (
            <span
              className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-success' : 'text-error'}`}
            >
              {formatCurrency(Math.abs(netCashFlow))}
            </span>
          )}
          <div className="text-sm text-muted-foreground mt-1">
            {isLoading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <>
                {formattedMonthYear} {transactionCountMessage}
              </>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Transactions</h2>

      {/* If loading */}
      {isLoading ? (
        <div className="space-y-3 sm:space-y-4">
          {skeletonTransactions.map((id) => (
            <Skeleton key={id} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : sharedTransactions.transactions.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-muted-foreground">No transactions found for this period.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {sharedTransactions.transactions.map((transaction) => (
            <TransactionItem key={transaction._id} transaction={transaction} />
          ))}
        </div>
      )}
    </div>
  );
}
