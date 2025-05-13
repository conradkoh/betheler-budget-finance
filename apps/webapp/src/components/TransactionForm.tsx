import { parseCurrencyInput } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CategorySelect } from './CategorySelect';
import { DateTimePicker } from './DateTimePicker';
import { type TransactionType, TransactionTypeSelect } from './TransactionTypeSelect';
import { Button } from './ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import { NumberInput } from './ui/number-input';

interface TransactionFormProps {
  onSuccess?: () => void;
  className?: string;
  initialType?: TransactionType;
  initialCategory?: string;
}

interface TransactionFormValues {
  amount: string;
  category: string;
  description: string;
  datetime: Date;
  transactionType: TransactionType;
}

export function TransactionForm({
  onSuccess,
  className,
  initialType = 'expense',
  initialCategory = 'Food',
}: TransactionFormProps) {
  const createTransaction = useSessionMutation(api.transactions.create);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TransactionFormValues>({
    defaultValues: {
      amount: '',
      category: initialCategory,
      description: '',
      datetime: new Date(),
      transactionType: initialType,
    },
  });

  const transactionType = form.watch('transactionType');
  const showCategoryField = transactionType === 'expense';

  useEffect(() => {
    if (transactionType === 'income') {
      form.setValue('category', 'Income');
    } else if (transactionType === 'savings') {
      form.setValue('category', 'Savings');
    }

    // Handle negative values when switching transaction types
    const currentAmount = parseCurrencyInput(form.getValues().amount);
    if (currentAmount && currentAmount < 0 && transactionType !== 'savings') {
      // Convert negative to positive when switching to a type that doesn't support negative values
      form.setValue('amount', String(Math.abs(currentAmount)));
    }
  }, [transactionType, form]);

  const onSubmit = useCallback(
    async (data: TransactionFormValues) => {
      try {
        setIsSubmitting(true);
        const amount = parseCurrencyInput(data.amount);

        if (!amount) {
          form.setError('amount', {
            message: 'Please enter a valid amount',
          });
          return;
        }

        // Validate amount based on transaction type
        if (data.transactionType === 'expense' && amount < 0) {
          form.setError('amount', {
            message: 'Expense amount must be positive',
          });
          return;
        }

        if (data.transactionType === 'income' && amount < 0) {
          form.setError('amount', {
            message: 'Income amount must be positive',
          });
          return;
        }

        // Savings can be positive (deposits) or negative (withdrawals)

        let category = data.category;
        if (data.transactionType === 'income') {
          category = 'Income';
        } else if (data.transactionType === 'savings') {
          category = 'Savings';
        }

        await createTransaction({
          amount,
          category,
          description: data.description,
          datetime: data.datetime.toISOString(),
          transactionType: data.transactionType,
        });

        form.reset();
        onSuccess?.();
      } catch (error) {
        console.error('Failed to create transaction:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [createTransaction, form, onSuccess]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
        <FormField
          control={form.control}
          name="transactionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Transaction Type</FormLabel>
              <FormControl>
                <TransactionTypeSelect
                  value={field.value}
                  onChange={field.onChange}
                  className="w-full"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Amount</FormLabel>
              <FormControl>
                <NumberInput
                  {...field}
                  placeholder="0.00"
                  className="text-base sm:text-sm"
                  prefix="$"
                  allowNegative={transactionType === 'savings'}
                />
              </FormControl>
              <FormDescription className="text-xs">
                {transactionType === 'expense'
                  ? 'Enter the expense amount (e.g., 10.99)'
                  : transactionType === 'income'
                    ? 'Enter the income amount (e.g., 1000.00)'
                    : 'Enter the savings amount (e.g., 500.00 for deposits, -500.00 for withdrawals)'}
              </FormDescription>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {showCategoryField && (
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Category</FormLabel>
                <FormControl>
                  <CategorySelect
                    value={field.value}
                    onChange={field.onChange}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Description</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Transaction description"
                  className="text-base sm:text-sm"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="datetime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Date and Time</FormLabel>
              <FormControl>
                <DateTimePicker value={field.value} onChange={field.onChange} className="w-full" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto mt-2">
          {isSubmitting ? 'Adding...' : `Add ${transactionType}`}
        </Button>
      </form>
    </Form>
  );
}
