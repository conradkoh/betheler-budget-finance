import { api } from '@workspace/backend/convex/_generated/api';
import type { Doc } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { useCallback, useMemo, useState } from 'react';
import { TransactionItem } from './TransactionItem';
import type { TransactionType } from './TransactionTypeSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';

interface TransactionListProps {
  year: number;
  month: number;
  actions?: React.ReactNode;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

export function TransactionList({
  year,
  month,
  actions,
  showAddButton = false,
  onAddClick,
}: TransactionListProps) {
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');

  // Get the client's timezone offset in minutes
  const timezoneOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);

  // We now accept year and month as props directly, no need for selectedDate
  const transactions = useSessionQuery(api.transactions.listByMonth, {
    year,
    month,
    transactionType: selectedType,
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Handler for transaction deletion
  const handleTransactionDeleted = useCallback(() => {
    // The list will automatically refresh due to Convex's reactivity
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {actions}
      </div>

      <div className="space-y-2">
        {transactions === undefined ? (
          // Loading state
          <>
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </>
        ) : transactions.length === 0 ? (
          // Empty state
          <div className="text-center p-8 border rounded-lg bg-card">
            <h3 className="font-medium mb-2">No transactions found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedType !== 'all'
                ? `You haven't added any ${selectedType} transactions for this month yet.`
                : "You haven't added any transactions for this month yet."}
            </p>
            {showAddButton && onAddClick && (
              <button
                type="button"
                onClick={onAddClick}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-sm"
              >
                Add your first transaction
              </button>
            )}
          </div>
        ) : (
          // Display transactions
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction._id}
                transaction={transaction as Doc<'transactions'>}
                onDelete={handleTransactionDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
