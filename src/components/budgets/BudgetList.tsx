'use client';

import { useState, useCallback } from 'react';

import type { BudgetsWithSpending, EnrichedBudget } from '@/types/budget';
import type { Category } from '@/types/category';

import { BudgetProgressBar } from '@/components/budgets/BudgetProgressBar';

interface BudgetListProps {
  budgetsWithSpending: BudgetsWithSpending;
  categories: Category[];
  onUpsertBudget: (categoryId: string, amount: number) => Promise<void>;
  onDeleteBudget: (budgetId: string) => Promise<void>;
}

export function BudgetList({
  budgetsWithSpending,
  categories,
  onUpsertBudget,
  onDeleteBudget,
}: BudgetListProps) {
  const { budgets, totalBudget } = budgetsWithSpending;

  // Build a map of categoryId → EnrichedBudget for quick lookups
  const budgetMap = new Map<string, EnrichedBudget>();
  for (const b of budgets) {
    budgetMap.set(b.categoryId, b);
  }

  if (categories.length === 0) {
    return (
      <div data-testid="budget-empty-state" className="py-12 text-center text-zinc-400">
        <p className="text-lg">No categories yet</p>
        <p className="text-sm">Create categories first to set budgets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const budget = budgetMap.get(cat.id);
        return (
          <BudgetRow
            key={cat.id}
            category={cat}
            budget={budget ?? null}
            onUpsertBudget={onUpsertBudget}
            onDeleteBudget={onDeleteBudget}
          />
        );
      })}

      {/* Total summary */}
      <div
        data-testid="budget-total"
        className="flex items-center justify-between border-t border-zinc-700 pt-4 text-sm font-semibold"
      >
        <span>Total Budget</span>
        <span className="font-mono tabular-nums">${totalBudget.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BudgetRow — one row per category with inline input + progress bar
// ---------------------------------------------------------------------------

interface BudgetRowProps {
  category: Category;
  budget: EnrichedBudget | null;
  onUpsertBudget: (categoryId: string, amount: number) => Promise<void>;
  onDeleteBudget: (budgetId: string) => Promise<void>;
}

function BudgetRow({ category, budget, onUpsertBudget, onDeleteBudget: _onDeleteBudget }: BudgetRowProps) {
  const initialValue = budget ? String(budget.budgetAmount) : '';
  const [inputValue, setInputValue] = useState(initialValue);

  const handleBlur = useCallback(async () => {
    const numericValue = parseFloat(inputValue);
    const originalValue = budget ? budget.budgetAmount : NaN;

    // If the value hasn't changed, skip the upsert
    if (numericValue === originalValue) {
      return;
    }

    // If empty and budget exists, could delete — but for now treat as no-op
    if (inputValue.trim() === '' && !budget) {
      return;
    }

    if (!isNaN(numericValue) && numericValue > 0) {
      await onUpsertBudget(category.id, numericValue);
    }
  }, [inputValue, budget, category.id, onUpsertBudget]);

  return (
    <div data-testid={`budget-row-${category.id}`} className="space-y-2 rounded-lg border border-zinc-800 p-4">
      <div className="flex items-center gap-3">
        <span className="text-lg">{category.icon}</span>
        <span className="flex-1 font-medium">{category.name}</span>
        <div className="flex items-center gap-1">
          <span className="text-sm text-zinc-400">$</span>
          <input
            type="number"
            data-testid={`budget-input-${category.id}`}
            className="w-24 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-mono text-sm tabular-nums text-white focus:border-indigo-500 focus:outline-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            placeholder="0"
            min={0}
            step={0.01}
          />
        </div>
      </div>

      {budget && (
        <BudgetProgressBar
          categoryName={category.name}
          icon={category.icon}
          budgetAmount={budget.budgetAmount}
          spentAmount={budget.spentAmount}
          percentUsed={budget.percentUsed}
          status={budget.status}
        />
      )}
    </div>
  );
}
