import { cn } from '@/lib/utils';
import { forwardRef, useState } from 'react';
import { Input } from './input';

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'prefix'> {
  value?: string;
  onChange?: (value: string) => void;
  allowNegative?: boolean;
  className?: string;
  prefix?: React.ReactNode;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value = '', onChange, allowNegative = true, className, prefix, ...props }, ref) => {
    const [hasFocus, setHasFocus] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Only allow digits, decimal point, and minus sign if allowNegative is true
      const regex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;

      if (newValue === '' || regex.test(newValue)) {
        onChange?.(newValue);
      }
    };

    const toggleNegative = () => {
      if (!allowNegative) return;

      if (value.startsWith('-')) {
        onChange?.(value.substring(1));
      } else if (value !== '') {
        onChange?.(`-${value}`);
      }
    };

    // Set the appropriate pattern based on whether negative values are allowed
    const inputPattern = allowNegative ? '-?[0-9]*(\\.[0-9]*)?' : '[0-9]*(\\.[0-9]*)?';

    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          type="text"
          inputMode="decimal"
          pattern={inputPattern}
          value={value}
          onChange={handleChange}
          onFocus={() => setHasFocus(true)}
          onBlur={() => setHasFocus(false)}
          className={cn(prefix ? 'pl-8' : '', className)}
          ref={ref}
          {...props}
        />
        {allowNegative && hasFocus && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-md"
            onClick={toggleNegative}
            tabIndex={-1}
          >
            +/-
          </button>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };
