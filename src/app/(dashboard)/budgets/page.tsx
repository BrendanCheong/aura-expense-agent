'use client';

import { DollarSign, Percent, Loader2, AlertCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { BudgetList } from '@/components/budgets/BudgetList';
import { MonthSelector } from '@/components/budgets/MonthSelector';
import { SalaryAllocation } from '@/components/budgets/SalaryAllocation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBudgets } from '@/hooks/use-budgets';
import { useCategories } from '@/hooks/use-categories';
import { useUserProfile } from '@/hooks/use-user-profile';
import { BudgetMode } from '@/lib/enums';

export default function BudgetsPage() {
  const {
    budgetsWithSpending,
    isLoading: budgetsLoading,
    error: budgetsError,
    upsertBudget,
    deleteBudget,
    setMonth,
  } = useBudgets();
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const { user, isLoading: userLoading, updateProfile } = useUserProfile();

  const isLoading = budgetsLoading || categoriesLoading || userLoading;
  const error = budgetsError || categoriesError;

  // Mode toggle — controlled locally, persisted via updateProfile
  const [activeMode, setActiveMode] = useState<BudgetMode>(
    user?.budgetMode ?? BudgetMode.DIRECT,
  );

  const handleModeToggle = useCallback(
    async (mode: BudgetMode) => {
      setActiveMode(mode);
      try {
        await updateProfile({ budgetMode: mode });
      } catch {
        // Revert on failure
        setActiveMode((prev) =>
          prev === BudgetMode.DIRECT ? BudgetMode.PERCENTAGE : BudgetMode.DIRECT,
        );
        toast.error('Failed to update budget mode');
      }
    },
    [updateProfile],
  );

  const handleUpsertBudget = useCallback(
    async (categoryId: string, amount: number) => {
      try {
        await upsertBudget(categoryId, amount);
        toast.success('Budget updated');
      } catch {
        toast.error('Failed to update budget');
      }
    },
    [upsertBudget],
  );

  const handleDeleteBudget = useCallback(
    async (budgetId: string) => {
      try {
        await deleteBudget(budgetId);
        toast.success('Budget deleted');
      } catch {
        toast.error('Failed to delete budget');
      }
    },
    [deleteBudget],
  );

  const handleApplyAllocation = useCallback(
    async (allocations: { categoryId: string; percentage: number; amount: number }[]) => {
      try {
        // Upsert each allocation as a budget amount
        await Promise.all(
          allocations
            .filter((a) => a.amount > 0)
            .map((a) => upsertBudget(a.categoryId, a.amount)),
        );
        toast.success('Allocations applied');
      } catch {
        toast.error('Failed to apply allocations');
      }
    },
    [upsertBudget],
  );

  const handleSalaryChange = useCallback(
    async (salary: number) => {
      try {
        await updateProfile({ monthlySalary: salary });
      } catch {
        toast.error('Failed to update salary');
      }
    },
    [updateProfile],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" data-testid="budget-loading">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const currentYear = budgetsWithSpending?.year ?? new Date().getFullYear();
  const currentMonth = budgetsWithSpending?.month ?? new Date().getMonth() + 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set monthly spending limits per category.
          </p>
        </div>
        <MonthSelector year={currentYear} month={currentMonth} onChange={setMonth} />
      </div>

      <Separator />

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={activeMode === BudgetMode.DIRECT ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeToggle(BudgetMode.DIRECT)}
          className="gap-1.5"
          aria-label="$ Direct"
        >
          <DollarSign className="h-4 w-4" />
          Direct
        </Button>
        <Button
          variant={activeMode === BudgetMode.PERCENTAGE ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeToggle(BudgetMode.PERCENTAGE)}
          className="gap-1.5"
          aria-label="% Allocate"
        >
          <Percent className="h-4 w-4" />
          Allocate
        </Button>
      </div>

      {/* Mode content */}
      {budgetsWithSpending && activeMode === BudgetMode.DIRECT && (
        <BudgetList
          budgetsWithSpending={budgetsWithSpending}
          categories={categories}
          onUpsertBudget={handleUpsertBudget}
          onDeleteBudget={handleDeleteBudget}
        />
      )}

      {budgetsWithSpending && activeMode === BudgetMode.PERCENTAGE && (
        <SalaryAllocation
          categories={categories}
          budgetsWithSpending={budgetsWithSpending}
          monthlySalary={user?.monthlySalary ?? 0}
          onApplyAllocation={handleApplyAllocation}
          onSalaryChange={handleSalaryChange}
        />
      )}
    </div>
  );
}
