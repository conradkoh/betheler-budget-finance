import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { InfoIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { CategorySelect } from './CategorySelect';
import { Alert, AlertDescription } from './ui/alert';
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
import { NumberInput } from './ui/number-input';

import { formatCurrency, parseCurrencyInput } from '@/lib/formatCurrency';

interface BudgetFormProps {
  onSuccess?: () => void;
  className?: string;
  year: number;
  month: number;
  initialData?: {
    _id?: Id<'budgets'>;
    category: string;
    amount: number;
  };
}

interface BudgetFormValues {
  amount: string;
  category: string;
}

export function BudgetForm({ onSuccess, className, year, month, initialData }: BudgetFormProps) {
  const createBudget = useSessionMutation(api.budgets.create);
  const updateBudget = useSessionMutation(api.budgets.update);
  const addToBudget = useSessionMutation(api.budgets.addToBudget);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddToExisting, setShowAddToExisting] = useState(false);
  const [existingBudgetAmount, setExistingBudgetAmount] = useState<number | null>(null);

  // Get existing budgets to check for duplicates
  const existingBudgets = useSessionQuery(api.budgets.listByMonth, {
    year,
    month,
  });

  const form = useForm<BudgetFormValues>({
    defaultValues: {
      amount: initialData ? formatCurrency(initialData.amount, { showCurrency: false }) : '',
      category: initialData?.category || 'Food',
    },
  });

  // Check for existing budget on initial load
  useEffect(() => {
    if (!initialData && existingBudgets) {
      const currentCategory = form.getValues().category;
      const existingBudget = existingBudgets?.find((budget) => budget.category === currentCategory);

      if (existingBudget) {
        setExistingBudgetAmount(existingBudget.amount);
        setShowAddToExisting(true);
      }
    }
  }, [existingBudgets, initialData, form]);

  // Reset add to existing state when category changes
  const handleCategoryChange = useCallback(
    (newCategory: string) => {
      setShowAddToExisting(false);
      setExistingBudgetAmount(null);
      form.clearErrors('category');
      form.setValue('category', newCategory);

      // Check if this category already has a budget and show the message immediately
      const existingBudget = existingBudgets?.find((budget) => budget.category === newCategory);

      if (existingBudget && !initialData) {
        setExistingBudgetAmount(existingBudget.amount);
        setShowAddToExisting(true);
      }
    },
    [form, existingBudgets, initialData]
  );

  const onSubmit = useCallback(
    async (data: BudgetFormValues) => {
      try {
        setIsSubmitting(true);
        const amount = parseCurrencyInput(data.amount);

        if (!amount) {
          form.setError('amount', {
            message: 'Please enter a valid amount',
          });
          return;
        }

        if (amount <= 0) {
          form.setError('amount', {
            message: 'Budget amount must be greater than zero',
          });
          return;
        }

        // Check if we're updating an existing budget by looking for a valid ID
        const isUpdatingExistingBudget = initialData?._id !== undefined;

        if (isUpdatingExistingBudget && initialData?._id) {
          // Update existing budget
          await updateBudget({
            budgetId: initialData._id,
            amount,
          });
        } else {
          // Check if budget already exists for this category in this month
          const existingBudget = existingBudgets?.find(
            (budget) => budget.category === data.category
          );

          if (existingBudget) {
            if (showAddToExisting) {
              // Add to existing budget - double check it still exists
              const currentExistingBudget = existingBudgets?.find(
                (budget) => budget.category === data.category
              );

              if (!currentExistingBudget) {
                // Budget was removed, create new one instead
                await createBudget({
                  category: data.category,
                  amount,
                  year,
                  month,
                });
              } else {
                // Add to existing budget
                await addToBudget({
                  category: data.category,
                  amount,
                  year,
                  month,
                });
                toast.success(
                  `Added ${formatCurrency(amount)} to ${data.category} budget. New total: ${formatCurrency(currentExistingBudget.amount + amount)}`
                );
              }
            } else {
              // Show option to add to existing budget
              setExistingBudgetAmount(existingBudget.amount);
              setShowAddToExisting(true);
              return;
            }
          } else {
            // Create new budget
            await createBudget({
              category: data.category,
              amount,
              year,
              month,
            });
          }
        }

        toast.success(
          isUpdatingExistingBudget ? 'Budget updated successfully' : 'Budget added successfully'
        );
        form.reset();
        onSuccess?.();
      } catch (error) {
        console.error('Failed to save budget:', error);

        // Handle specific backend error for duplicate categories
        if (error instanceof Error && error.message.includes('Budget already exists')) {
          form.setError('category', {
            message: 'A budget for this category already exists in this month',
          });
          toast.error(
            `Budget for ${form.getValues().category} already exists. Please update the existing budget instead.`
          );
        } else {
          // General error handling
          toast.error('Failed to save budget. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      createBudget,
      updateBudget,
      addToBudget,
      form,
      onSuccess,
      initialData,
      year,
      month,
      existingBudgets,
      showAddToExisting,
      existingBudgetAmount,
      handleCategoryChange,
    ]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Category</FormLabel>
                <FormControl>
                  <CategorySelect
                    value={field.value}
                    onChange={handleCategoryChange}
                    className="w-full"
                    disabled={!!initialData}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Add to Existing Budget Alert */}
          {showAddToExisting && existingBudgetAmount !== null && (
            <Alert className="bg-info-bg border-info/20">
              <InfoIcon className="h-4 w-4 text-info" />
              <AlertDescription className="text-xs">
                A budget for {form.getValues().category} already exists (
                {formatCurrency(existingBudgetAmount)}). This amount will be added to the existing
                budget.
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Budget Amount</FormLabel>
                <FormControl>
                  <NumberInput
                    {...field}
                    placeholder="0.00"
                    className="text-base sm:text-sm"
                    prefix="$"
                    allowNegative={false}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Enter the budget amount for this category
                </FormDescription>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? 'Saving...'
              : initialData
                ? 'Update Budget'
                : showAddToExisting
                  ? 'Add to Existing Budget'
                  : 'Add Budget'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
