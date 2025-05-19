import { cn } from '@/lib/utils';

interface BudgetProgressProps {
  percentage: number;
  status: 'within_budget' | 'over_budget';
  className?: string;
}

export function BudgetProgress({ percentage, status, className }: BudgetProgressProps) {
  // Cap the visual percentage at 100% for the progress bar
  const cappedPercentage = Math.min(percentage, 100);

  // Determine the color based on the status and percentage
  const getColorClass = () => {
    if (status === 'over_budget') return 'bg-error';
    if (percentage > 80) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium">Spent</span>
        <span className="text-xs font-medium">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getColorClass())}
          style={{ width: `${cappedPercentage}%` }}
        />
      </div>
    </div>
  );
}
