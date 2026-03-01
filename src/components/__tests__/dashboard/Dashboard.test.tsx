/**
 * React unit tests — Dashboard components.
 *
 * Tests: TimeRangeTabs, SpendingDonut, BudgetProgressList,
 *        RecentTransactionsList, AlertBanner.
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  CategoryBreakdown,
  DashboardAlert,
  RecentTransaction,
} from '@/types/dashboard';

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
// Mock recharts — jsdom cannot render SVG charts
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  {
    categoryId: 'cat-food',
    categoryName: 'Food & Beverage',
    icon: '🍔',
    color: '#ef4444',
    spent: 188.30,
    budget: 400,
    percentage: 18.4,
    transactionCount: 7,
  },
  {
    categoryId: 'cat-transport',
    categoryName: 'Transportation',
    icon: '🚗',
    color: '#f97316',
    spent: 135,
    budget: 150,
    percentage: 13.2,
    transactionCount: 5,
  },
  {
    categoryId: 'cat-shopping',
    categoryName: 'Shopping',
    icon: '🛍️',
    color: '#a855f7',
    spent: 327.19,
    budget: 300,
    percentage: 31.9,
    transactionCount: 4,
  },
];

const MOCK_RECENT_TRANSACTIONS: RecentTransaction[] = [
  {
    id: 'tx-001',
    vendor: 'GRAB *GRABFOOD',
    amount: 18.50,
    categoryName: 'Food & Beverage',
    categoryIcon: '🍔',
    transactionDate: '2026-02-08T12:30:00+08:00',
    confidence: 'high',
  },
  {
    id: 'tx-002',
    vendor: 'MRT TOP-UP',
    amount: 20.00,
    categoryName: 'Transportation',
    categoryIcon: '🚗',
    transactionDate: '2026-02-07T08:15:00+08:00',
    confidence: 'medium',
  },
  {
    id: 'tx-003',
    vendor: 'SHOPEE SG',
    amount: 45.90,
    categoryName: 'Shopping',
    categoryIcon: '🛍️',
    transactionDate: '2026-02-06T14:20:00+08:00',
    confidence: 'low',
  },
];

const MOCK_ALERTS: DashboardAlert[] = [
  {
    type: 'over_budget',
    categoryId: 'cat-shopping',
    categoryName: 'Shopping',
    icon: '🛍️',
    budgetAmount: 300,
    spentAmount: 327.19,
    percentUsed: 109.06,
    overAmount: 27.19,
    message: 'Shopping is $27.19 over your $300.00 budget',
  },
  {
    type: 'warning',
    categoryId: 'cat-transport',
    categoryName: 'Transportation',
    icon: '🚗',
    budgetAmount: 150,
    spentAmount: 135,
    percentUsed: 90,
    message: 'Transportation spending is at 90% of your $150.00 budget',
  },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ===========================================================================
// TimeRangeTabs
// ===========================================================================

describe('TimeRangeTabs', () => {
  let TimeRangeTabs: typeof import('@/components/dashboard/TimeRangeTabs').TimeRangeTabs;

  beforeEach(async () => {
    ({ TimeRangeTabs } = await import('@/components/dashboard/TimeRangeTabs'));
  });

  it('renders all three tabs (Week, Month, Year)', () => {
    const onChange = vi.fn();
    render(<TimeRangeTabs value="month" onChange={onChange} />);

    expect(screen.getByRole('tab', { name: /week/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /month/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /year/i })).toBeInTheDocument();
  });

  it('highlights the active tab (Month by default)', () => {
    const onChange = vi.fn();
    render(<TimeRangeTabs value="month" onChange={onChange} />);

    const monthTab = screen.getByRole('tab', { name: /month/i });
    expect(monthTab).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onChange when a different tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeRangeTabs value="month" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: /week/i }));
    expect(onChange).toHaveBeenCalledWith('week');
  });

  it('calls onChange with "year" when Year tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeRangeTabs value="month" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: /year/i }));
    expect(onChange).toHaveBeenCalledWith('year');
  });
});

// ===========================================================================
// SpendingDonut
// ===========================================================================

describe('SpendingDonut', () => {
  let SpendingDonut: typeof import('@/components/dashboard/SpendingDonut').SpendingDonut;

  beforeEach(async () => {
    ({ SpendingDonut } = await import('@/components/dashboard/SpendingDonut'));
  });

  it('renders chart container with data-testid="spending-donut"', () => {
    render(
      <SpendingDonut
        data={MOCK_CATEGORY_BREAKDOWN}
        totalSpent={650.49}
      />,
    );
    expect(screen.getByTestId('spending-donut')).toBeInTheDocument();
  });

  it('shows total spent amount in center', () => {
    render(
      <SpendingDonut
        data={MOCK_CATEGORY_BREAKDOWN}
        totalSpent={650.49}
      />,
    );
    const total = screen.getByTestId('donut-total');
    expect(total).toBeInTheDocument();
    expect(total.textContent).toMatch(/650\.49/);
  });

  it('shows empty state when data array is empty', () => {
    render(
      <SpendingDonut
        data={[]}
        totalSpent={0}
      />,
    );
    // Should render an empty state indicator instead of the chart
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });

  it('renders without crashing when selectedCategory is provided', () => {
    render(
      <SpendingDonut
        data={MOCK_CATEGORY_BREAKDOWN}
        totalSpent={650.49}
        selectedCategory="cat-food"
        onSegmentClick={vi.fn()}
      />,
    );
    expect(screen.getByTestId('spending-donut')).toBeInTheDocument();
  });

  it('renders without crashing when selectedCategory is null', () => {
    render(
      <SpendingDonut
        data={MOCK_CATEGORY_BREAKDOWN}
        totalSpent={650.49}
        selectedCategory={null}
        onSegmentClick={vi.fn()}
      />,
    );
    expect(screen.getByTestId('spending-donut')).toBeInTheDocument();
  });
});

// ===========================================================================
// BudgetProgressList
// ===========================================================================

describe('BudgetProgressList', () => {
  let BudgetProgressList: typeof import('@/components/dashboard/BudgetProgressList').BudgetProgressList;

  beforeEach(async () => {
    ({ BudgetProgressList } = await import('@/components/dashboard/BudgetProgressList'));
  });

  it('renders a progress item for each category', () => {
    render(<BudgetProgressList budgets={MOCK_CATEGORY_BREAKDOWN} />);

    const items = screen.getAllByTestId('budget-progress-item');
    expect(items).toHaveLength(3);
  });

  it('shows category name and icon for each item', () => {
    render(<BudgetProgressList budgets={MOCK_CATEGORY_BREAKDOWN} />);

    expect(screen.getByText('Food & Beverage')).toBeInTheDocument();
    expect(screen.getByText('🍔')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('🚗')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
    expect(screen.getByText('🛍️')).toBeInTheDocument();
  });

  it('shows spent and budget amounts', () => {
    render(<BudgetProgressList budgets={MOCK_CATEGORY_BREAKDOWN} />);

    // Food: $188.30 / $400.00
    expect(screen.getByText(/188\.30/)).toBeInTheDocument();
    expect(screen.getByText(/400\.00/)).toBeInTheDocument();
    // Transport: $135.00 / $150.00
    expect(screen.getByText(/135\.00/)).toBeInTheDocument();
    expect(screen.getByText(/150\.00/)).toBeInTheDocument();
    // Shopping: $327.19 / $300.00
    expect(screen.getByText(/327\.19/)).toBeInTheDocument();
    expect(screen.getByText(/300\.00/)).toBeInTheDocument();
  });

  it('applies green styling for on_track category (< 80%)', () => {
    render(<BudgetProgressList budgets={MOCK_CATEGORY_BREAKDOWN} />);

    // Food: 188.3/400 = 47.075% → on_track → green
    const items = screen.getAllByTestId('budget-progress-item');
    const foodItem = items[0];
    expect(foodItem.querySelector('[data-testid="progress-indicator"]')).toHaveClass('bg-green-500');
  });

  it('applies amber styling for warning category (80-99%)', () => {
    render(<BudgetProgressList budgets={MOCK_CATEGORY_BREAKDOWN} />);

    // Transport: 135/150 = 90% → warning → amber
    const items = screen.getAllByTestId('budget-progress-item');
    const transportItem = items[1];
    expect(transportItem.querySelector('[data-testid="progress-indicator"]')).toHaveClass('bg-amber-500');
  });

  it('applies red styling for over_budget category (>= 100%)', () => {
    render(<BudgetProgressList budgets={MOCK_CATEGORY_BREAKDOWN} />);

    // Shopping: 327.19/300 = 109.06% → over_budget → red
    const items = screen.getAllByTestId('budget-progress-item');
    const shoppingItem = items[2];
    expect(shoppingItem.querySelector('[data-testid="progress-indicator"]')).toHaveClass('bg-red-500');
  });

  it('shows over-budget text for categories over 100%', () => {
    render(<BudgetProgressList budgets={MOCK_CATEGORY_BREAKDOWN} />);

    // Shopping is over budget — should display "over budget" indicator
    expect(screen.getByText(/over budget/i)).toBeInTheDocument();
  });

  it('renders empty list when budgets is empty', () => {
    render(<BudgetProgressList budgets={[]} />);

    expect(screen.queryByTestId('budget-progress-item')).not.toBeInTheDocument();
  });
});

// ===========================================================================
// RecentTransactionsList
// ===========================================================================

describe('RecentTransactionsList', () => {
  let RecentTransactionsList: typeof import('@/components/dashboard/RecentTransactionsList').RecentTransactionsList;

  beforeEach(async () => {
    ({ RecentTransactionsList } = await import(
      '@/components/dashboard/RecentTransactionsList'
    ));
  });

  it('renders all transactions', () => {
    render(<RecentTransactionsList transactions={MOCK_RECENT_TRANSACTIONS} />);

    const rows = screen.getAllByTestId('recent-tx-row');
    expect(rows).toHaveLength(3);
  });

  it('shows vendor, amount, and category icon for each transaction', () => {
    render(<RecentTransactionsList transactions={MOCK_RECENT_TRANSACTIONS} />);

    // Vendor names
    expect(screen.getByText('GRAB *GRABFOOD')).toBeInTheDocument();
    expect(screen.getByText('MRT TOP-UP')).toBeInTheDocument();
    expect(screen.getByText('SHOPEE SG')).toBeInTheDocument();

    // Amounts
    expect(screen.getByText(/18\.50/)).toBeInTheDocument();
    expect(screen.getByText(/20\.00/)).toBeInTheDocument();
    expect(screen.getByText(/45\.90/)).toBeInTheDocument();

    // Category icons
    expect(screen.getByText('🍔')).toBeInTheDocument();
    expect(screen.getByText('🚗')).toBeInTheDocument();
    expect(screen.getByText('🛍️')).toBeInTheDocument();
  });

  it('filters transactions by selected category', () => {
    render(
      <RecentTransactionsList
        transactions={MOCK_RECENT_TRANSACTIONS}
        selectedCategory="Food & Beverage"
      />,
    );

    const rows = screen.getAllByTestId('recent-tx-row');
    expect(rows).toHaveLength(1);
    expect(screen.getByText('GRAB *GRABFOOD')).toBeInTheDocument();
    expect(screen.queryByText('MRT TOP-UP')).not.toBeInTheDocument();
    expect(screen.queryByText('SHOPEE SG')).not.toBeInTheDocument();
  });

  it('shows "View All Transactions" link with correct href', () => {
    render(<RecentTransactionsList transactions={MOCK_RECENT_TRANSACTIONS} />);

    const link = screen.getByRole('link', { name: /view all transactions/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/transactions');
  });

  it('shows empty state when no transactions are provided', () => {
    render(<RecentTransactionsList transactions={[]} />);

    expect(screen.queryByTestId('recent-tx-row')).not.toBeInTheDocument();
    // Should show some empty state message
    expect(screen.getByText(/no.*transaction/i)).toBeInTheDocument();
  });

  it('shows all transactions when selectedCategory is null', () => {
    render(
      <RecentTransactionsList
        transactions={MOCK_RECENT_TRANSACTIONS}
        selectedCategory={null}
      />,
    );

    const rows = screen.getAllByTestId('recent-tx-row');
    expect(rows).toHaveLength(3);
  });
});

// ===========================================================================
// AlertBanner
// ===========================================================================

describe('AlertBanner', () => {
  let AlertBanner: typeof import('@/components/dashboard/AlertBanner').AlertBanner;

  beforeEach(async () => {
    ({ AlertBanner } = await import('@/components/dashboard/AlertBanner'));
  });

  it('renders over_budget alert with correct test id', () => {
    render(<AlertBanner alerts={MOCK_ALERTS} />);

    expect(screen.getByTestId('alert-over-budget')).toBeInTheDocument();
    expect(screen.getByTestId('alert-over-budget')).toHaveTextContent(/shopping/i);
  });

  it('renders warning alert with correct test id', () => {
    render(<AlertBanner alerts={MOCK_ALERTS} />);

    expect(screen.getByTestId('alert-warning')).toBeInTheDocument();
    expect(screen.getByTestId('alert-warning')).toHaveTextContent(/transportation/i);
  });

  it('shows over-budget alerts before warnings (critical first)', () => {
    render(<AlertBanner alerts={MOCK_ALERTS} />);

    const alertElements = screen.getAllByTestId(/^alert-/);
    // First alert should be over_budget
    expect(alertElements[0]).toHaveAttribute('data-testid', 'alert-over-budget');
    // Second alert should be warning
    expect(alertElements[1]).toHaveAttribute('data-testid', 'alert-warning');
  });

  it('shows alert messages', () => {
    render(<AlertBanner alerts={MOCK_ALERTS} />);

    expect(
      screen.getByText('Shopping is $27.19 over your $300.00 budget'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Transportation spending is at 90% of your $150.00 budget'),
    ).toBeInTheDocument();
  });

  it('dismiss button hides all alerts', async () => {
    const user = userEvent.setup();
    render(<AlertBanner alerts={MOCK_ALERTS} />);

    // Both alerts visible
    expect(screen.getByTestId('alert-over-budget')).toBeInTheDocument();
    expect(screen.getByTestId('alert-warning')).toBeInTheDocument();

    // Click dismiss
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissBtn);

    // Both alerts hidden
    await waitFor(() => {
      expect(screen.queryByTestId('alert-over-budget')).not.toBeInTheDocument();
      expect(screen.queryByTestId('alert-warning')).not.toBeInTheDocument();
    });
  });

  it('renders nothing when alerts array is empty', () => {
    const { container } = render(<AlertBanner alerts={[]} />);

    expect(screen.queryByTestId('alert-over-budget')).not.toBeInTheDocument();
    expect(screen.queryByTestId('alert-warning')).not.toBeInTheDocument();
    // Container should be empty or contain nothing visible
    expect(container.textContent).toBe('');
  });

  it('handles alerts with only warnings (no over_budget)', () => {
    const warningOnly: DashboardAlert[] = [MOCK_ALERTS[1]];
    render(<AlertBanner alerts={warningOnly} />);

    expect(screen.queryByTestId('alert-over-budget')).not.toBeInTheDocument();
    expect(screen.getByTestId('alert-warning')).toBeInTheDocument();
  });

  it('handles alerts with only over_budget (no warnings)', () => {
    const overBudgetOnly: DashboardAlert[] = [MOCK_ALERTS[0]];
    render(<AlertBanner alerts={overBudgetOnly} />);

    expect(screen.getByTestId('alert-over-budget')).toBeInTheDocument();
    expect(screen.queryByTestId('alert-warning')).not.toBeInTheDocument();
  });
});
