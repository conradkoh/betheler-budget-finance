/**
 * Formats a number as currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  options?: { currency?: string; showCurrency?: boolean }
): string {
  const currency = options?.currency || 'USD';
  const style = options?.showCurrency === false ? 'decimal' : 'currency';

  return new Intl.NumberFormat('en-US', {
    style,
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parses a currency string to a number
 * @param value - The currency string to parse
 * @returns The parsed number or null if invalid
 */
export function parseCurrencyInput(value: string): number | null {
  if (!value) return null;

  // Handle case where value might just be a minus sign
  if (value === '-') return null;

  // Remove currency symbols, commas, and other non-numeric characters except decimal point and minus sign
  const cleaned = value.replace(/[^0-9.-]/g, '');

  // Handle multiple decimal points or minus signs
  const decimalCount = (cleaned.match(/\./g) || []).length;
  const minusCount = (cleaned.match(/-/g) || []).length;

  if (decimalCount > 1 || minusCount > 1) {
    return null;
  }

  // Ensure minus sign is only at the beginning
  if (minusCount === 1 && !cleaned.startsWith('-')) {
    return null;
  }

  const number = Number.parseFloat(cleaned);
  return Number.isNaN(number) ? null : number;
}
