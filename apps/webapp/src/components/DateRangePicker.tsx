'use client';

import { cn } from '@/lib/utils';
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  disabled = false,
  placeholder = 'Select date range',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange>(value);

  // Update temp range when value prop changes
  React.useEffect(() => {
    setTempRange(value);
  }, [value]);

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      const newRange = { ...tempRange, startDate: date };
      // If start date is after end date, adjust end date
      if (date > tempRange.endDate) {
        newRange.endDate = date;
      }
      setTempRange(newRange);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      const newRange = { ...tempRange, endDate: date };
      // If end date is before start date, adjust start date
      if (date < tempRange.startDate) {
        newRange.startDate = date;
      }
      setTempRange(newRange);
    }
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempRange(value);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reset temp range to current value when opening
      setTempRange(value);
    }
    setIsOpen(open);
  };

  // Navigation functions for previous/next month
  const handlePrevMonth = () => {
    const prevMonth = subMonths(value.startDate, 1);
    const newRange = {
      startDate: startOfMonth(prevMonth),
      endDate: endOfMonth(prevMonth),
    };
    onChange(newRange);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(value.startDate, 1);
    const newRange = {
      startDate: startOfMonth(nextMonth),
      endDate: endOfMonth(nextMonth),
    };
    onChange(newRange);
  };

  const formatDateRange = () => {
    if (!value.startDate || !value.endDate) {
      return placeholder;
    }

    const start = format(value.startDate, 'MMM d, yyyy');
    const end = format(value.endDate, 'MMM d, yyyy');

    if (start === end) {
      return start;
    }

    return `${start} - ${end}`;
  };

  // Check if current range is a full month to enable/disable navigation
  const isFullMonth = React.useMemo(() => {
    const monthStart = startOfMonth(value.startDate);
    const monthEnd = endOfMonth(value.startDate);
    return (
      value.startDate.getTime() === monthStart.getTime() &&
      value.endDate.getTime() === monthEnd.getTime()
    );
  }, [value.startDate, value.endDate]);

  // Get current date to disable next month button if current month is selected
  const isCurrentMonth = React.useMemo(() => {
    if (!isFullMonth) return false;
    const now = new Date();
    return format(now, 'yyyy-MM') === format(value.startDate, 'yyyy-MM');
  }, [value.startDate, isFullMonth]);

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevMonth}
        aria-label="Previous month"
        className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
        disabled={disabled}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      <div className="flex-1">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !value.startDate && 'text-muted-foreground'
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Start Date</h4>
                  <Calendar
                    mode="single"
                    selected={tempRange.startDate}
                    onSelect={handleStartDateSelect}
                    defaultMonth={tempRange.startDate}
                    disabled={(date) => {
                      // Disable future dates
                      return date > new Date();
                    }}
                    initialFocus
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">End Date</h4>
                  <Calendar
                    mode="single"
                    selected={tempRange.endDate}
                    onSelect={handleEndDateSelect}
                    defaultMonth={tempRange.endDate}
                    disabled={(date) => {
                      // Disable future dates and dates before start date
                      return date > new Date() || date < tempRange.startDate;
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleApply}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        aria-label="Next month"
        disabled={disabled || isCurrentMonth}
        className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
