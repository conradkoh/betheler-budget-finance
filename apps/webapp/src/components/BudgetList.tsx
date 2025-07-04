import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { format } from 'date-fns';
import { Loader2, PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BudgetForm } from './BudgetForm';
import { BudgetItem } from './BudgetItem';
import { EmptyBudgetState } from './EmptyBudgetState';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface BudgetListProps {
  year: number;
  month: number;
}

export function BudgetList({ year, month }: BudgetListProps) {
  const [isAddingBudget, setIsAddingBudget] = useState(false);

  // Get the client's timezone offset in minutes
  const timezoneOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);

  // Get budget progress data
  const budgetProgress = useSessionQuery(api.budgets.getBudgetProgress, {
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

  if (budgetProgress === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading budgets...</span>
      </div>
    );
  }

  // Extract budgeted and unbudgeted categories
  const { budgeted, unbudgeted } = budgetProgress;
  const hasBudgets = budgeted.length > 0;
  const hasTransactions = unbudgeted.length > 0;

  // Format month and year
  const formattedMonth = format(new Date(year, month), 'MMMM yyyy');

  return (
    <div className="space-y-6">
      {/* Add Budget Dialog - moved outside conditionals so it can be triggered from anywhere */}
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

      {!hasBudgets ? (
        <EmptyBudgetState
          year={year}
          month={month}
          hasTransactions={hasTransactions}
          formattedMonth={formattedMonth}
          onOpenAddBudget={handleOpenAddBudget}
        />
      ) : (
        <>
          {/* Budgeted categories */}
          {budgeted.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Your Budgets</h3>

                {/* Icon button for adding a new budget */}
                <Button size="sm" variant="outline" onClick={handleOpenAddBudget}>
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgeted.map((budget) => (
                  <BudgetItem
                    key={budget._id.toString()}
                    budget={{
                      ...budget,
                      status: budget.status as 'within_budget' | 'over_budget',
                    }}
                    year={year}
                    month={month}
                    onDelete={() => {
                      // Refreshing happens automatically with Convex
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Unbudgeted categories - now outside of the hasBudgets conditional */}
      {unbudgeted.length > 0 && (
        <div className="space-y-4 mt-8">
          <h3 className="text-lg font-medium">Categories Without Budgets</h3>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Unbudgeted Spending</CardTitle>
              <CardDescription>
                Consider adding budgets for these categories to better track your spending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {unbudgeted.map((item) => (
                  <li key={item.category} className="py-3 flex justify-between items-center">
                    <span>{item.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        Spent:{' '}
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(item.spent)}
                      </span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Add Budget
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Budget for {item.category}</DialogTitle>
                            <DialogDescription>
                              Set a budget amount for this category
                            </DialogDescription>
                          </DialogHeader>
                          <BudgetForm
                            year={year}
                            month={month}
                            initialData={{
                              category: item.category,
                              amount: item.spent, // Suggest the current spending as default
                            }}
                            onSuccess={handleBudgetCreated}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
