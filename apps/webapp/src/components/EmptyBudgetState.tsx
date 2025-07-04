import { CopyIcon, PlusIcon } from 'lucide-react';
import { CopyBudgetButton } from './CopyBudgetButton';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface EmptyBudgetStateProps {
  year: number;
  month: number;
  hasTransactions: boolean;
  formattedMonth: string;
  onOpenAddBudget: () => void;
}

export function EmptyBudgetState({
  year,
  month,
  hasTransactions,
  formattedMonth,
  onOpenAddBudget,
}: EmptyBudgetStateProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">No Budgets Yet</CardTitle>
        <CardDescription>Get started with your budget for {formattedMonth}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="mb-6 max-w-md text-center">
          <p className="text-muted-foreground mb-3">
            {hasTransactions
              ? 'You have transactions this month, but no budget categories set up.'
              : 'No transactions or budgets found for this month yet.'}
          </p>

          <div className="py-4 flex flex-col gap-4 items-center">
            <div className="w-full max-w-xs">
              <CopyBudgetButton
                targetYear={year}
                targetMonth={month}
                variant="default"
                size="lg"
                fullWidth={true}
                icon={<CopyIcon className="mr-2 h-4 w-4" />}
                label="Copy Budgets from Previous Month"
              />
            </div>

            <span className="text-sm text-muted-foreground">or</span>

            <Button
              onClick={onOpenAddBudget}
              variant="outline"
              size="lg"
              className="w-full max-w-xs"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Budget Manually
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <p className="text-xs text-muted-foreground text-center max-w-md">
          Setting up a budget helps you track your spending and stay on top of your financial goals.
          {!hasTransactions && (
            <span className="block mt-1">
              Start by adding your first budget or copy from a previous month.
            </span>
          )}
        </p>
      </CardFooter>
    </Card>
  );
}
