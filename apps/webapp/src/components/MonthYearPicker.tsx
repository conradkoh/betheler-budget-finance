import { addMonths, format, subMonths } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface MonthYearPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
  disabled?: boolean;
}

export function MonthYearPicker({
  value,
  onChange,
  className,
  disabled = false,
}: MonthYearPickerProps) {
  const handlePrevMonth = () => {
    onChange(subMonths(value, 1));
  };

  const handleNextMonth = () => {
    onChange(addMonths(value, 1));
  };

  // Get current date to disable next month button if current month is selected
  const isCurrentMonth = format(new Date(), 'yyyy-MM') === format(value, 'yyyy-MM');

  return (
    <div className={cn('flex items-center justify-between space-x-2', className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevMonth}
        aria-label="Previous month"
        className="h-8 w-8 sm:h-9 sm:w-9"
        disabled={disabled}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <div className="font-medium text-sm sm:text-base">{format(value, 'MMMM yyyy')}</div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        aria-label="Next month"
        disabled={disabled || isCurrentMonth}
        className="h-8 w-8 sm:h-9 sm:w-9"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
