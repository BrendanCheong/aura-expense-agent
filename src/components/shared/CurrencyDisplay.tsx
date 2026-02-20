'use client';

import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  /** Show + sign for positive amounts. Default false. */
  showSign?: boolean;
}

const SGD_FORMATTER = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function CurrencyDisplay({ amount, className, showSign = false }: CurrencyDisplayProps) {
  const formatted = SGD_FORMATTER.format(amount);
  const display = showSign && amount > 0 ? `+${formatted}` : formatted;

  return (
    <span
      className={cn('font-mono text-sm font-medium tabular-nums tracking-wide', className)}
      data-testid="currency-display"
    >
      {display}
    </span>
  );
}
