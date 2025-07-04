import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency, parseCurrencyInput } from '@/lib/formatCurrency';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { NumberInput } from './ui/number-input';

interface AddSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSuccess?: () => void;
}

export function AddSavingsModal({
  isOpen,
  onClose,
  selectedDate,
  onSuccess,
}: AddSavingsModalProps) {
  const createTransaction = useSessionMutation(api.transactions.create);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Monthly Savings');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format the date as an ISO string for the API
  const formattedDate = selectedDate.toISOString();

  // Format the date string for display
  const displayDate = selectedDate.toLocaleDateString('default', {
    month: 'long',
    year: 'numeric',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseCurrencyInput(amount);

    if (!parsedAmount) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (parsedAmount === 0) {
      toast.error('Amount cannot be zero.');
      return;
    }

    const action = parsedAmount > 0 ? 'deposit to' : 'withdrawal from';

    setIsSubmitting(true);

    try {
      await createTransaction({
        amount: parsedAmount,
        category: 'Savings',
        datetime: formattedDate,
        description: description.trim() || 'Monthly Savings',
        transactionType: 'savings',
      });

      toast.success(
        `Successfully added ${formatCurrency(Math.abs(parsedAmount))} ${action} your savings.`
      );

      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error('Failed to add savings. Please try again.');
      console.error('Failed to create transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    // Reset form
    setAmount('');
    setDescription('Monthly Savings');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Savings</DialogTitle>
          <DialogDescription>
            Add savings for {displayDate}. This will help track your financial goals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <NumberInput
              id="amount"
              placeholder="0.00"
              value={amount}
              onChange={setAmount}
              required
              autoFocus
              prefix="$"
              allowNegative={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Monthly Savings"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save to Savings'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
