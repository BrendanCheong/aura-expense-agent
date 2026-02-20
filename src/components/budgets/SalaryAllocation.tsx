'use client';

import { useState, useMemo, useCallback } from 'react';

import type { BudgetsWithSpending, EnrichedBudget } from '@/types/budget';
import type { Category } from '@/types/category';

import { AllocationBar } from '@/components/budgets/AllocationBar';
import { Button } from '@/components/ui/button';


interface AllocationEntry {
  categoryId: string;
  percentage: number;
  amount: number;
}

interface SalaryAllocationProps {
  categories: Category[];
  budgetsWithSpending: BudgetsWithSpending;
  monthlySalary: number;
  onApplyAllocation: (allocations: AllocationEntry[]) => Promise<void>;
  onSalaryChange: (salary: number) => void;
}

export function SalaryAllocation({
  categories,
  budgetsWithSpending,
  monthlySalary,
  onApplyAllocation,
  onSalaryChange,
}: SalaryAllocationProps) {
  const { budgets } = budgetsWithSpending;

  // Build a map of categoryId → existing budget
  const budgetMap = useMemo(() => {
    const map = new Map<string, EnrichedBudget>();
    for (const b of budgets) {
      map.set(b.categoryId, b);
    }
    return map;
  }, [budgets]);

  // Derive initial percentages from existing budget amounts and salary
  const initialPercentages = useMemo(() => {
    const pctMap: Record<string, number> = {};
    for (const cat of categories) {
      const existing = budgetMap.get(cat.id);
      if (existing && monthlySalary > 0) {
        pctMap[cat.id] = Math.round((existing.budgetAmount / monthlySalary) * 100);
      } else {
        pctMap[cat.id] = 0;
      }
    }
    return pctMap;
  }, [categories, budgetMap, monthlySalary]);

  const [percentages, setPercentages] = useState<Record<string, number>>(initialPercentages);
  const [salaryInput, setSalaryInput] = useState(String(monthlySalary));

  // Recompute dollar amounts from percentages
  const allocations = useMemo(() => {
    const salary = parseFloat(salaryInput) || 0;
    return categories.map((cat) => ({
      categoryId: cat.id,
      percentage: percentages[cat.id] ?? 0,
      amount: Math.round(((percentages[cat.id] ?? 0) / 100) * salary * 100) / 100,
    }));
  }, [categories, percentages, salaryInput]);

  const totalAllocatedPercent = useMemo(
    () => Object.values(percentages).reduce((sum, pct) => sum + pct, 0),
    [percentages],
  );

  const salary = parseFloat(salaryInput) || 0;
  const totalAllocatedAmount = allocations.reduce((sum, a) => sum + a.amount, 0);
  const savingsAmount = Math.max(0, salary - totalAllocatedAmount);

  const handlePercentageChange = useCallback((categoryId: string, value: string) => {
    const numeric = parseInt(value, 10);
    setPercentages((prev) => ({
      ...prev,
      [categoryId]: isNaN(numeric) ? 0 : numeric,
    }));
  }, []);

  const handleSalaryBlur = useCallback(() => {
    const numericSalary = parseFloat(salaryInput);
    if (!isNaN(numericSalary) && numericSalary >= 0) {
      onSalaryChange(numericSalary);
    }
  }, [salaryInput, onSalaryChange]);

  const handleApply = useCallback(async () => {
    await onApplyAllocation(allocations);
  }, [allocations, onApplyAllocation]);

  const isDisabled = salary <= 0;

  return (
    <div className="space-y-6">
      {/* Salary input */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-zinc-300" htmlFor="salary-input">
          Monthly Salary
        </label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-zinc-400">$</span>
          <input
            id="salary-input"
            type="number"
            data-testid="salary-input"
            className="w-32 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-mono text-sm tabular-nums text-white focus:border-indigo-500 focus:outline-none"
            value={salaryInput}
            onChange={(e) => setSalaryInput(e.target.value)}
            onBlur={handleSalaryBlur}
            placeholder="0"
            min={0}
            step={100}
          />
        </div>
      </div>

      {/* Allocation bar */}
      <AllocationBar allocatedPercent={Math.min(totalAllocatedPercent, 100)} />

      {/* Category allocation rows */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const alloc = allocations.find((a) => a.categoryId === cat.id);
          const pct = percentages[cat.id] ?? 0;
          const amount = alloc?.amount ?? 0;

          return (
            <div
              key={cat.id}
              data-testid={`allocation-row-${cat.id}`}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3"
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="flex-1 text-sm font-medium">{cat.name}</span>

              {/* Percentage input */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  data-testid={`pct-input-${cat.id}`}
                  className="w-16 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-mono text-sm tabular-nums text-white focus:border-indigo-500 focus:outline-none"
                  value={pct || ''}
                  onChange={(e) => handlePercentageChange(cat.id, e.target.value)}
                  placeholder="0"
                  min={0}
                  max={100}
                />
                <span className="text-sm text-zinc-400">%</span>
              </div>

              {/* Dollar amount display */}
              <span className="w-24 text-right font-mono text-sm tabular-nums text-zinc-300">
                ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Savings row */}
      <div
        data-testid="savings-row"
        className="flex items-center justify-between rounded-lg border border-emerald-800/50 bg-emerald-900/10 p-3"
      >
        <span className="text-sm font-medium text-emerald-400">💰 Savings</span>
        <span className="font-mono text-sm tabular-nums text-emerald-300">
          ${savingsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Apply button */}
      <Button
        onClick={handleApply}
        disabled={isDisabled}
        className="w-full"
        aria-label="Apply Allocation"
      >
        Apply Allocation
      </Button>
    </div>
  );
}
