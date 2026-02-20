'use client';

import type { BudgetStatus } from '@/types/budget';

import { cn } from '@/lib/utils';


interface BudgetProgressBarProps {
  categoryName: string;
  icon: string;
  budgetAmount: number;
  spentAmount: number;
  percentUsed: number;
  status: BudgetStatus;
}

const STATUS_COLORS: Record<BudgetStatus, string> = {
  on_track: 'bg-green-500',
  warning: 'bg-amber-500',
  over_budget: 'bg-red-500',
};

const STATUS_TRACK_COLORS: Record<BudgetStatus, string> = {
  on_track: 'bg-green-500/20',
  warning: 'bg-amber-500/20',
  over_budget: 'bg-red-500/20',
};

export function BudgetProgressBar({
  categoryName,
  icon,
  budgetAmount,
  spentAmount,
  percentUsed,
  status,
}: BudgetProgressBarProps) {
  const overAmount = status === 'over_budget' ? spentAmount - budgetAmount : 0;

  return (
    <div className="space-y-1" data-testid="budget-progress-bar">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {icon} {categoryName}
        </span>
        <span
          className={cn(
            'font-mono text-sm tabular-nums',
            status === 'over_budget' && 'text-red-500',
            status === 'warning' && 'text-amber-500',
          )}
        >
          ${spentAmount.toFixed(2)} / ${budgetAmount.toFixed(2)}
        </span>
      </div>
      <div className={cn('relative h-2 w-full overflow-hidden rounded-full', STATUS_TRACK_COLORS[status])}>
        <div
          className={cn('h-full rounded-full transition-all', STATUS_COLORS[status])}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
          data-testid="budget-progress-indicator"
        />
      </div>
      {status === 'over_budget' && (
        <p className="text-xs text-red-400">
          ${overAmount.toFixed(2)} over budget
        </p>
      )}
    </div>
  );
}
