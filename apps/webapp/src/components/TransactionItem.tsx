'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import type { Doc } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface TransactionItemProps {
  transaction: Doc<'transactions'>;
  onDelete?: () => void;
}

export function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteTransaction = useSessionMutation(api.transactions.remove);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTransaction({ transactionId: transaction._id });
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const transactionDate = format(new Date(transaction.datetime), 'MMM d, yyyy');
  const transactionTime = format(new Date(transaction.datetime), 'h:mm a');

  const transactionType = transaction.transactionType || 'expense';
  const isIncome = transactionType === 'income';
  const isSavings = transactionType === 'savings';
  const isSavingsWithdrawal = isSavings && transaction.amount < 0;

  const getTransactionIcon = () => {
    switch (transactionType) {
      case 'income':
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case 'savings':
        return transaction.amount >= 0 ? (
          <PiggyBank className="h-4 w-4 text-info" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-info" />
        );
      default:
        return <ArrowUpRight className="h-4 w-4 text-error" />;
    }
  };

  const getAmountColor = () => {
    switch (transactionType) {
      case 'income':
        return 'text-success';
      case 'savings':
        return transaction.amount >= 0 ? 'text-info' : 'text-error';
      default:
        return 'text-error';
    }
  };

  return (
    <>
      <Card className="transition-all hover:shadow-md">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {getTransactionIcon()}

                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <p className="text-sm font-medium truncate">
                    {transaction.description}
                    {isSavingsWithdrawal && <span className="ml-1 text-xs">(Withdrawal)</span>}
                  </p>
                  {transaction.category && (
                    <div className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      {transaction.category}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-1">
                {transactionDate} at {transactionTime}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <p className={cn('font-medium', getAmountColor())}>
                {isIncome || (isSavings && transaction.amount > 0) ? '+' : '-'}
                {formatCurrency(Math.abs(transaction.amount))}
              </p>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
