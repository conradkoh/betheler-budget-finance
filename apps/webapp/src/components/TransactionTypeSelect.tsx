import { CreditCard, DollarSign, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const transactionTypes = [
  {
    value: 'expense',
    label: 'Expense',
    icon: CreditCard,
  },
  {
    value: 'income',
    label: 'Income',
    icon: DollarSign,
  },
  {
    value: 'savings',
    label: 'Savings',
    icon: PiggyBank,
  },
];

export type TransactionType = 'expense' | 'income' | 'savings';

interface TransactionTypeSelectProps {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  className?: string;
}

export function TransactionTypeSelect({ value, onChange, className }: TransactionTypeSelectProps) {
  const selectedType = transactionTypes.find((type) => type.value === value);

  return (
    <Select value={value} onValueChange={(newValue) => onChange(newValue as TransactionType)}>
      <SelectTrigger className={cn(className)}>
        <SelectValue>
          <div className="flex items-center gap-2">
            {selectedType && <selectedType.icon className="h-4 w-4" />}
            <span>{selectedType?.label || 'Select type'}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {transactionTypes.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <div className="flex items-center gap-2">
              <type.icon className="h-4 w-4" />
              <span>{type.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
