'use client';

import { useState } from 'react';
import { TransactionForm } from './TransactionForm';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface TransactionModalProps {
  /**
   * Callback when a transaction is successfully added
   */
  onSuccess?: () => void;

  /**
   * Button label text or React node
   * @default "Add Transaction"
   */
  buttonLabel?: React.ReactNode;

  /**
   * Button variant
   * @default "default"
   */
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

  /**
   * Trigger element or custom button
   */
  trigger?: React.ReactNode;

  /**
   * Additional class name for the trigger button
   */
  className?: string;

  /**
   * Preset transaction type (for Add Income/Add Savings buttons)
   */
  transactionType?: 'expense' | 'income' | 'savings';

  /**
   * Preset category
   */
  category?: string;
}

/**
 * A modal component for adding transactions directly from the dashboard
 */
export function TransactionModal({
  onSuccess,
  buttonLabel = 'Add Transaction',
  buttonVariant = 'default',
  trigger,
  className,
  transactionType,
  category,
}: TransactionModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    // Close the modal
    setIsOpen(false);
    // Call the onSuccess callback if provided
    onSuccess?.();
  };

  // Determine dialog title based on transaction type
  const getDialogTitle = () => {
    switch (transactionType) {
      case 'income':
        return 'Add Income';
      case 'savings':
        return 'Add to Savings';
      default:
        return 'Add Transaction';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        // Use the custom trigger if provided
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        // Otherwise use the default button
        <DialogTrigger asChild>
          <Button variant={buttonVariant} className={className}>
            {buttonLabel}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>Enter the details of your transaction below</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <TransactionForm
            onSuccess={handleSuccess}
            initialType={transactionType}
            initialCategory={category}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
