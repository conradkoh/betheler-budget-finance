import { cn } from '@/lib/utils';
import { format, set } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const [date, setDate] = React.useState(value);

  // Update internal state when prop changes
  React.useEffect(() => {
    setDate(value);
  }, [value]);

  // Handle date selection
  const handleDateSelect = React.useCallback(
    (newDate: Date | undefined) => {
      if (newDate) {
        const updatedDate = set(newDate, {
          hours: date.getHours(),
          minutes: date.getMinutes(),
          seconds: 0,
          milliseconds: 0,
        });
        setDate(updatedDate);
        onChange(updatedDate);
      }
    },
    [date, onChange]
  );

  // Handle time input changes
  const handleTimeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const timeString = e.target.value;
      const [hoursStr, minutesStr] = timeString.split(':');

      let hours = Number.parseInt(hoursStr, 10);
      let minutes = Number.parseInt(minutesStr, 10);

      // Ensure hours and minutes are valid numbers
      hours = Number.isNaN(hours) ? 0 : hours;
      minutes = Number.isNaN(minutes) ? 0 : minutes;

      // Clamp hours and minutes to valid ranges
      hours = Math.max(0, Math.min(23, hours));
      minutes = Math.max(0, Math.min(59, minutes));

      const newDate = set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
      setDate(newDate);
      onChange(newDate);
    },
    [date, onChange]
  );

  // Format the time string for the input
  const timeString = React.useMemo(() => {
    return format(date, 'HH:mm');
  }, [date]);

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-2', className)}>
      <Popover modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(date) => {
              // Example: Disable future dates
              // return date > new Date();
              return false;
            }}
          />
        </PopoverContent>
      </Popover>
      <div className="flex items-center">
        <Input
          type="time"
          value={timeString}
          onChange={handleTimeChange}
          className="w-full"
          aria-label="Select time"
        />
      </div>
    </div>
  );
}
