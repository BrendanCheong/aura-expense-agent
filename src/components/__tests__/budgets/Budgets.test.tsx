/**
 * React unit tests — Budget components.
 *
 * Tests: MonthSelector, BudgetProgressBar, AllocationBar, BudgetList,
 *        SalaryAllocation, BudgetsPage.
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BudgetsWithSpending, EnrichedBudget } from '@/types/budget';
import type { Category } from '@/types/category';

import { BudgetMode } from '@/lib/enums';

// Polyfill for jsdom missing pointer capture APIs (needed by Radix UI)
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || (() => {});
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || (() => {});
}

// Radix UI portals need scrollIntoView
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-food',
    userId: 'user-1',
    name: 'Food & Beverage',
    description: 'Restaurants, hawker centres',
    icon: '🍔',
    color: '#ef4444',
    isDefault: true,
    sortOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-transport',
    userId: 'user-1',
    name: 'Transportation',
    description: 'Public transit, ride-hailing',
    icon: '🚗',
    color: '#f97316',
    isDefault: true,
    sortOrder: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-shopping',
    userId: 'user-1',
    name: 'Shopping',
    description: 'Online and retail shopping',
    icon: '🛍️',
    color: '#a855f7',
    isDefault: true,
    sortOrder: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const MOCK_ENRICHED_BUDGETS: EnrichedBudget[] = [
  {
    id: 'budget-001',
    categoryId: 'cat-food',
    budgetAmount: 400,
    spentAmount: 188.3,
    remainingAmount: 211.7,
    percentUsed: 47.08,
    status: 'on_track',
    year: 2026,
    month: 2,
  },
  {
    id: 'budget-002',
    categoryId: 'cat-transport',
    budgetAmount: 150,
    spentAmount: 135,
    remainingAmount: 15,
    percentUsed: 90,
    status: 'warning',
    year: 2026,
    month: 2,
  },
  {
    id: 'budget-003',
    categoryId: 'cat-shopping',
    budgetAmount: 300,
    spentAmount: 327.19,
    remainingAmount: -27.19,
    percentUsed: 109.06,
    status: 'over_budget',
    year: 2026,
    month: 2,
  },
];

const MOCK_BUDGETS_WITH_SPENDING: BudgetsWithSpending = {
  year: 2026,
  month: 2,
  budgets: MOCK_ENRICHED_BUDGETS,
  totalBudget: 850,
  totalSpent: 650.49,
  totalRemaining: 199.51,
};

const MOCK_EMPTY_BUDGETS: BudgetsWithSpending = {
  year: 2026,
  month: 2,
  budgets: [],
  totalBudget: 0,
  totalSpent: 0,
  totalRemaining: 0,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ===========================================================================
// MonthSelector
// ===========================================================================

describe('MonthSelector', () => {
  let MonthSelector: typeof import('@/components/budgets/MonthSelector').MonthSelector;

  beforeEach(async () => {
    ({ MonthSelector } = await import('@/components/budgets/MonthSelector'));
  });

  it('displays the current month and year', () => {
    const onChange = vi.fn();
    render(<MonthSelector year={2026} month={2} onChange={onChange} />);
    expect(screen.getByTestId('month-selector')).toHaveTextContent(/February 2026/i);
  });

  it('navigates to previous month when Prev button is clicked', () => {
    const onChange = vi.fn();
    render(<MonthSelector year={2026} month={2} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(onChange).toHaveBeenCalledWith(2026, 1);
  });

  it('navigates to next month when Next button is clicked', () => {
    const onChange = vi.fn();
    render(<MonthSelector year={2026} month={2} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(onChange).toHaveBeenCalledWith(2026, 3);
  });

  it('wraps year correctly when navigating from January backward', () => {
    const onChange = vi.fn();
    render(<MonthSelector year={2026} month={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(onChange).toHaveBeenCalledWith(2025, 12);
  });

  it('wraps year correctly when navigating from December forward', () => {
    const onChange = vi.fn();
    render(<MonthSelector year={2026} month={12} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(onChange).toHaveBeenCalledWith(2027, 1);
  });
});

// ===========================================================================
// BudgetProgressBar
// ===========================================================================

describe('BudgetProgressBar', () => {
  let BudgetProgressBar: typeof import('@/components/budgets/BudgetProgressBar').BudgetProgressBar;

  beforeEach(async () => {
    ({ BudgetProgressBar } = await import('@/components/budgets/BudgetProgressBar'));
  });

  it('renders on_track status with green indicator', () => {
    render(
      <BudgetProgressBar
        categoryName="Food & Beverage"
        icon="🍔"
        budgetAmount={400}
        spentAmount={188.3}
        percentUsed={47.08}
        status="on_track"
      />,
    );
    const bar = screen.getByTestId('budget-progress-bar');
    expect(bar).toBeInTheDocument();
    // Green indicator for on_track
    expect(screen.getByTestId('budget-progress-indicator')).toHaveClass('bg-green-500');
  });

  it('renders warning status with amber indicator', () => {
    render(
      <BudgetProgressBar
        categoryName="Transportation"
        icon="🚗"
        budgetAmount={150}
        spentAmount={135}
        percentUsed={90}
        status="warning"
      />,
    );
    expect(screen.getByTestId('budget-progress-indicator')).toHaveClass('bg-amber-500');
  });

  it('renders over_budget status with red indicator', () => {
    render(
      <BudgetProgressBar
        categoryName="Shopping"
        icon="🛍️"
        budgetAmount={300}
        spentAmount={327.19}
        percentUsed={109.06}
        status="over_budget"
      />,
    );
    expect(screen.getByTestId('budget-progress-indicator')).toHaveClass('bg-red-500');
  });

  it('displays spent and budget amounts', () => {
    render(
      <BudgetProgressBar
        categoryName="Food & Beverage"
        icon="🍔"
        budgetAmount={400}
        spentAmount={188.3}
        percentUsed={47.08}
        status="on_track"
      />,
    );
    expect(screen.getByTestId('budget-progress-bar')).toHaveTextContent(/188\.30/);
    expect(screen.getByTestId('budget-progress-bar')).toHaveTextContent(/400\.00/);
  });

  it('displays category name with icon', () => {
    render(
      <BudgetProgressBar
        categoryName="Food & Beverage"
        icon="🍔"
        budgetAmount={400}
        spentAmount={188.3}
        percentUsed={47.08}
        status="on_track"
      />,
    );
    expect(screen.getByTestId('budget-progress-bar')).toHaveTextContent('🍔');
    expect(screen.getByTestId('budget-progress-bar')).toHaveTextContent('Food & Beverage');
  });

  it('shows over-budget message when status is over_budget', () => {
    render(
      <BudgetProgressBar
        categoryName="Shopping"
        icon="🛍️"
        budgetAmount={300}
        spentAmount={327.19}
        percentUsed={109.06}
        status="over_budget"
      />,
    );
    expect(screen.getByTestId('budget-progress-bar')).toHaveTextContent(/27\.19.*over budget/i);
  });
});

// ===========================================================================
// AllocationBar
// ===========================================================================

describe('AllocationBar', () => {
  let AllocationBar: typeof import('@/components/budgets/AllocationBar').AllocationBar;

  beforeEach(async () => {
    ({ AllocationBar } = await import('@/components/budgets/AllocationBar'));
  });

  it('renders allocated vs savings proportions', () => {
    render(<AllocationBar allocatedPercent={38} />);
    const bar = screen.getByTestId('allocation-bar');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveTextContent(/38%/);
    expect(bar).toHaveTextContent(/62%/);
  });

  it('renders 0% allocated state', () => {
    render(<AllocationBar allocatedPercent={0} />);
    const bar = screen.getByTestId('allocation-bar');
    expect(bar).toHaveTextContent(/0%.*allocated/i);
    expect(bar).toHaveTextContent(/100%.*savings/i);
  });

  it('renders 100% allocated state', () => {
    render(<AllocationBar allocatedPercent={100} />);
    const bar = screen.getByTestId('allocation-bar');
    expect(bar).toHaveTextContent(/100%.*allocated/i);
    expect(bar).toHaveTextContent(/0%.*savings/i);
  });
});

// ===========================================================================
// BudgetList (Mode A — Direct Amount)
// ===========================================================================

describe('BudgetList', () => {
  let BudgetList: typeof import('@/components/budgets/BudgetList').BudgetList;

  beforeEach(async () => {
    ({ BudgetList } = await import('@/components/budgets/BudgetList'));
  });

  it('renders category rows with progress bars', () => {
    render(
      <BudgetList
        budgetsWithSpending={MOCK_BUDGETS_WITH_SPENDING}
        categories={MOCK_CATEGORIES}
        onUpsertBudget={vi.fn()}
        onDeleteBudget={vi.fn()}
      />,
    );
    expect(screen.getByTestId('budget-row-cat-food')).toBeInTheDocument();
    expect(screen.getByTestId('budget-row-cat-transport')).toBeInTheDocument();
    expect(screen.getByTestId('budget-row-cat-shopping')).toBeInTheDocument();
  });

  it('renders budget input fields with current amounts', () => {
    render(
      <BudgetList
        budgetsWithSpending={MOCK_BUDGETS_WITH_SPENDING}
        categories={MOCK_CATEGORIES}
        onUpsertBudget={vi.fn()}
        onDeleteBudget={vi.fn()}
      />,
    );
    const foodInput = screen.getByTestId('budget-input-cat-food') as HTMLInputElement;
    expect(foodInput.value).toBe('400');
  });

  it('shows progress bars for each budget', () => {
    render(
      <BudgetList
        budgetsWithSpending={MOCK_BUDGETS_WITH_SPENDING}
        categories={MOCK_CATEGORIES}
        onUpsertBudget={vi.fn()}
        onDeleteBudget={vi.fn()}
      />,
    );
    const progressBars = screen.getAllByTestId('budget-progress-indicator');
    expect(progressBars.length).toBe(3);
  });

  it('shows total budget summary', () => {
    render(
      <BudgetList
        budgetsWithSpending={MOCK_BUDGETS_WITH_SPENDING}
        categories={MOCK_CATEGORIES}
        onUpsertBudget={vi.fn()}
        onDeleteBudget={vi.fn()}
      />,
    );
    expect(screen.getByTestId('budget-total')).toHaveTextContent(/850/);
  });

  it('calls onUpsertBudget when budget input is edited and blurred', async () => {
    const user = userEvent.setup();
    const onUpsertBudget = vi.fn().mockResolvedValue(undefined);

    render(
      <BudgetList
        budgetsWithSpending={MOCK_BUDGETS_WITH_SPENDING}
        categories={MOCK_CATEGORIES}
        onUpsertBudget={onUpsertBudget}
        onDeleteBudget={vi.fn()}
      />,
    );

    const input = screen.getByTestId('budget-input-cat-food');
    await user.clear(input);
    await user.type(input, '500');
    await user.tab(); // blur

    await waitFor(() => {
      expect(onUpsertBudget).toHaveBeenCalledWith('cat-food', 500);
    });
  });

  it('renders empty input for categories without budgets', () => {
    const emptyBudgets: BudgetsWithSpending = {
      ...MOCK_EMPTY_BUDGETS,
    };
    render(
      <BudgetList
        budgetsWithSpending={emptyBudgets}
        categories={MOCK_CATEGORIES}
        onUpsertBudget={vi.fn()}
        onDeleteBudget={vi.fn()}
      />,
    );
    // Should show input rows for each category, even without existing budgets
    const foodInput = screen.getByTestId('budget-input-cat-food') as HTMLInputElement;
    expect(foodInput.value).toBe('');
  });

  it('shows empty state text when no categories exist', () => {
    render(
      <BudgetList
        budgetsWithSpending={MOCK_EMPTY_BUDGETS}
        categories={[]}
        onUpsertBudget={vi.fn()}
        onDeleteBudget={vi.fn()}
      />,
    );
    expect(screen.getByTestId('budget-empty-state')).toBeInTheDocument();
  });

  it('does not call onUpsertBudget when value is unchanged', async () => {
    const user = userEvent.setup();
    const onUpsertBudget = vi.fn();

    render(
      <BudgetList
        budgetsWithSpending={MOCK_BUDGETS_WITH_SPENDING}
        categories={MOCK_CATEGORIES}
        onUpsertBudget={onUpsertBudget}
        onDeleteBudget={vi.fn()}
      />,
    );

    const input = screen.getByTestId('budget-input-cat-food');
    await user.click(input);
    await user.tab(); // blur without change

    expect(onUpsertBudget).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// SalaryAllocation (Mode B — Salary Percentage)
// ===========================================================================

describe('SalaryAllocation', () => {
  let SalaryAllocation: typeof import('@/components/budgets/SalaryAllocation').SalaryAllocation;

  beforeEach(async () => {
    ({ SalaryAllocation } = await import('@/components/budgets/SalaryAllocation'));
  });

  it('renders salary input field', () => {
    render(
      <SalaryAllocation
        categories={MOCK_CATEGORIES}
        budgetsWithSpending={MOCK_BUDGETS_WITH_SPENDING}
        monthlySalary={5000}
        onApplyAllocation={vi.fn()}
        onSalaryChange={vi.fn()}
      />,
    );
    const salaryInput = screen.getByTestId('salary-input') as HTMLInputElement;
    expect(salaryInput.value).toBe('5000');
  });

  it('calculates dollar amounts from percentages', () => {
    render(
      <SalaryAllocation
        categories={MOCK_CATEGORIES}
        budgetsWithSpending={MOCK_BUDGETS_WITH_SPENDING}
        monthlySalary={5000}
        onApplyAllocation={vi.fn()}
        onSalaryChange={vi.fn()}
      />,
    );
    // Food budget is $400 of $5000 = 8%, shown as $400.00
    const foodRow = screen.getByTestId('allocation-row-cat-food');
    expect(foodRow).toHaveTextContent(/400/);
  });

  it('shows savings row with unallocated amount', () => {
    render(
      <SalaryAllocation
        categories={MOCK_CATEGORIES}
        budgetsWithSpending={MOCK_BUDGETS_WITH_SPENDING}
        monthlySalary={5000}
        onApplyAllocation={vi.fn()}
        onSalaryChange={vi.fn()}
      />,
    );
    // Total budgets = 850, salary = 5000, savings = 4150
    const savingsRow = screen.getByTestId('savings-row');
    expect(savingsRow).toHaveTextContent(/4,150/);
  });

  it('renders allocation bar', () => {
    render(
      <SalaryAllocation
        categories={MOCK_CATEGORIES}
        budgetsWithSpending={MOCK_BUDGETS_WITH_SPENDING}
        monthlySalary={5000}
        onApplyAllocation={vi.fn()}
        onSalaryChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('allocation-bar')).toBeInTheDocument();
  });

  it('calls onApplyAllocation with category amounts when Apply is clicked', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn().mockResolvedValue(undefined);

    render(
      <SalaryAllocation
        categories={MOCK_CATEGORIES}
        budgetsWithSpending={MOCK_BUDGETS_WITH_SPENDING}
        monthlySalary={5000}
        onApplyAllocation={onApply}
        onSalaryChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /apply allocation/i }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1);
      const allocations = onApply.mock.calls[0][0];
      expect(allocations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ categoryId: 'cat-food' }),
        ]),
      );
    });
  });

  it('handles zero salary gracefully', () => {
    render(
      <SalaryAllocation
        categories={MOCK_CATEGORIES}
        budgetsWithSpending={MOCK_EMPTY_BUDGETS}
        monthlySalary={0}
        onApplyAllocation={vi.fn()}
        onSalaryChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('salary-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply allocation/i })).toBeDisabled();
  });

  it('calls onSalaryChange when salary input is modified', async () => {
    const user = userEvent.setup();
    const onSalaryChange = vi.fn();

    render(
      <SalaryAllocation
        categories={MOCK_CATEGORIES}
        budgetsWithSpending={MOCK_EMPTY_BUDGETS}
        monthlySalary={5000}
        onApplyAllocation={vi.fn()}
        onSalaryChange={onSalaryChange}
      />,
    );

    const salaryInput = screen.getByTestId('salary-input');
    await user.clear(salaryInput);
    await user.type(salaryInput, '6000');
    await user.tab();

    await waitFor(() => {
      expect(onSalaryChange).toHaveBeenCalledWith(6000);
    });
  });

  it('updates dollar amounts when percentage inputs change', async () => {
    const user = userEvent.setup();

    render(
      <SalaryAllocation
        categories={MOCK_CATEGORIES}
        budgetsWithSpending={MOCK_EMPTY_BUDGETS}
        monthlySalary={5000}
        onApplyAllocation={vi.fn()}
        onSalaryChange={vi.fn()}
      />,
    );

    const pctInput = screen.getByTestId('pct-input-cat-food');
    await user.clear(pctInput);
    await user.type(pctInput, '10');

    await waitFor(() => {
      const foodRow = screen.getByTestId('allocation-row-cat-food');
      expect(foodRow).toHaveTextContent(/500/); // 10% of 5000
    });
  });
});

// ===========================================================================
// BudgetsPage (orchestrator)
// ===========================================================================

describe('BudgetsPage', () => {
  // We mock the hooks to isolate page-level orchestration logic
  const mockBudgetsHook = {
    budgetsWithSpending: MOCK_BUDGETS_WITH_SPENDING,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    upsertBudget: vi.fn().mockResolvedValue(undefined),
    deleteBudget: vi.fn().mockResolvedValue(undefined),
    setMonth: vi.fn(),
  };

  const mockCategoriesHook = {
    categories: MOCK_CATEGORIES,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  };

  const mockUserProfileHook = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: '',
      inboundEmail: 'test@inbound.aura.local',
      oauthProvider: 'google',
      monthlySalary: 5000,
      budgetMode: BudgetMode.DIRECT,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    isLoading: false,
    error: null,
    updateProfile: vi.fn().mockResolvedValue(undefined),
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.resetModules();
    vi.doMock('@/hooks/use-budgets', () => ({
      useBudgets: vi.fn(() => mockBudgetsHook),
    }));
    vi.doMock('@/hooks/use-categories', () => ({
      useCategories: vi.fn(() => mockCategoriesHook),
    }));
    vi.doMock('@/hooks/use-user-profile', () => ({
      useUserProfile: vi.fn(() => mockUserProfileHook),
    }));
  });

  it('renders page heading', async () => {
    const { default: BudgetsPage } = await import('@/app/(dashboard)/budgets/page');
    render(<BudgetsPage />);
    expect(screen.getByRole('heading', { name: /budget/i })).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    vi.resetModules();
    vi.doMock('@/hooks/use-budgets', () => ({
      useBudgets: vi.fn(() => ({ ...mockBudgetsHook, isLoading: true })),
    }));
    vi.doMock('@/hooks/use-categories', () => ({
      useCategories: vi.fn(() => mockCategoriesHook),
    }));
    vi.doMock('@/hooks/use-user-profile', () => ({
      useUserProfile: vi.fn(() => mockUserProfileHook),
    }));
    const { default: BudgetsPage } = await import('@/app/(dashboard)/budgets/page');
    render(<BudgetsPage />);
    expect(screen.getByTestId('budget-loading')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    vi.resetModules();
    vi.doMock('@/hooks/use-budgets', () => ({
      useBudgets: vi.fn(() => ({ ...mockBudgetsHook, error: 'Failed to fetch', isLoading: false })),
    }));
    vi.doMock('@/hooks/use-categories', () => ({
      useCategories: vi.fn(() => mockCategoriesHook),
    }));
    vi.doMock('@/hooks/use-user-profile', () => ({
      useUserProfile: vi.fn(() => mockUserProfileHook),
    }));
    const { default: BudgetsPage } = await import('@/app/(dashboard)/budgets/page');
    render(<BudgetsPage />);
    expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
  });

  it('renders Mode A (direct) by default', async () => {
    const { default: BudgetsPage } = await import('@/app/(dashboard)/budgets/page');
    render(<BudgetsPage />);
    // BudgetList should be visible, not SalaryAllocation
    expect(screen.getByTestId('budget-row-cat-food')).toBeInTheDocument();
  });

  it('toggles between Mode A and Mode B', async () => {
    const user = userEvent.setup();
    const { default: BudgetsPage } = await import('@/app/(dashboard)/budgets/page');
    render(<BudgetsPage />);

    // Click the allocation toggle
    const toggleBtn = screen.getByRole('button', { name: /% allocate/i });
    await user.click(toggleBtn);

    // Now salary input should appear (Mode B)
    expect(screen.getByTestId('salary-input')).toBeInTheDocument();
  });
});
