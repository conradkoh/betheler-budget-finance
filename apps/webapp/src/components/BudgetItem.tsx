import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { Edit2Icon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';
import { BudgetForm } from './BudgetForm';
import { BudgetProgress } from './BudgetProgress';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface BudgetItemProps {
  budget: {
    _id: Id<'budgets'>;
    category: string;
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'within_budget' | 'over_budget';
  };
  onDelete?: () => void;
  year: number;
  month: number;
}

export function BudgetItem({ budget, onDelete, year, month }: BudgetItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const deleteBudget = useSessionMutation(api.budgets.remove);

  const handleDelete = async () => {
    try {
      await deleteBudget({ budgetId: budget._id });
      onDelete?.();
      setIsConfirmingDelete(false);
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    onDelete?.(); // Refresh the list
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{budget.category}</CardTitle>
              <CardDescription>Monthly Budget</CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8"
              >
                <Edit2Icon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsConfirmingDelete(true)}
                className="h-8 w-8 text-destructive"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-lg font-medium">{formatCurrency(budget.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-lg font-medium">{formatCurrency(budget.spent)}</p>
            </div>
          </div>

          <BudgetProgress percentage={budget.percentage} status={budget.status} className="mb-2" />

          <div className="flex justify-between items-center mt-3">
            <p className="text-sm">
              {budget.status === 'within_budget' ? 'Remaining:' : 'Over budget by:'}
            </p>
            <p
              className={cn(
                'font-medium',
                budget.status === 'within_budget' ? 'text-success' : 'text-error'
              )}
            >
              {budget.status === 'within_budget'
                ? formatCurrency(budget.remaining)
                : formatCurrency(Math.abs(budget.remaining))}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>Update the budget amount for {budget.category}</DialogDescription>
          </DialogHeader>
          <BudgetForm
            initialData={budget}
            year={year}
            month={month}
            onSuccess={handleEditSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Budget</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the budget for {budget.category}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
