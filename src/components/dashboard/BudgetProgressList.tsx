'use client';

import { Progress } from '@/components/ui/progress';
import type { CategoryBreakdown } from '@/types/dashboard';

interface BudgetProgressListProps {
  budgets: CategoryBreakdown[];
}

function getStatusColor(spent: number, budget: number): string {
  if (budget <= 0) {
    return 'bg-green-500';
  }
  const ratio = spent / budget;
  if (ratio >= 1) {
    return 'bg-red-500';
  }
  if (ratio >= 0.8) {
    return 'bg-amber-500';
  }
  return 'bg-green-500';
}

function formatSGD(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(amount);
}

export function BudgetProgressList({ budgets }: BudgetProgressListProps) {
  if (budgets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {budgets.map((cat) => {
        const percent = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
        const colorClass = getStatusColor(cat.spent, cat.budget);
        const isOverBudget = cat.budget > 0 && cat.spent >= cat.budget;

        return (
          <div
            key={cat.categoryId}
            data-testid="budget-progress-item"
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span className="font-medium">{cat.categoryName}</span>
                {isOverBudget && (
                  <span className="text-destructive text-xs font-medium">
                    Over budget
                  </span>
                )}
              </div>
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {formatSGD(cat.spent)} / {formatSGD(cat.budget)}
              </span>
            </div>
            <div className="relative">
              <Progress value={Math.min(percent, 100)} className="h-2" />
              {/* Color indicator overlay */}
              <div
                data-testid="progress-indicator"
                className={`${colorClass} absolute left-0 top-0 h-2 rounded-full transition-all`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
