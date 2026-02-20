/**
 * React unit tests — Transaction components.
 *
 * Tests: ConfidenceIndicator, CategoryBadge, CurrencyDisplay, EmptyState,
 *        TransactionTable, TransactionCardList, TransactionFilters,
 *        AddTransactionSheet, TransactionSheet, TransactionsPage.
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';

import { Confidence, TransactionSource } from '@/lib/enums';

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

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-001',
    userId: 'user-1',
    categoryId: 'cat-food',
    amount: 18.5,
    vendor: 'GRAB *GRABFOOD',
    description: '',
    transactionDate: '2026-02-01T12:30:00+08:00',
    resendEmailId: 'resend-001',
    rawEmailSubject: 'Transaction alert: GRAB *GRABFOOD',
    confidence: Confidence.HIGH,
    source: TransactionSource.EMAIL,
    createdAt: '2026-02-01T12:30:00Z',
    updatedAt: '2026-02-01T12:30:00Z',
  },
  {
    id: 'tx-002',
    userId: 'user-1',
    categoryId: 'cat-transport',
    amount: 20.0,
    vendor: 'MRT TOP-UP',
    description: 'Monthly card top-up',
    transactionDate: '2026-02-01T08:15:00+08:00',
    resendEmailId: null,
    rawEmailSubject: '',
    confidence: Confidence.MEDIUM,
    source: TransactionSource.MANUAL,
    createdAt: '2026-02-01T08:15:00Z',
    updatedAt: '2026-02-01T08:15:00Z',
  },
  {
    id: 'tx-003',
    userId: 'user-1',
    categoryId: 'cat-shopping',
    amount: 45.9,
    vendor: 'SHOPEE SG',
    description: '',
    transactionDate: '2026-02-03T14:20:00+08:00',
    resendEmailId: 'resend-005',
    rawEmailSubject: 'Transaction alert: SHOPEE SG',
    confidence: Confidence.LOW,
    source: TransactionSource.EMAIL,
    createdAt: '2026-02-03T14:20:00Z',
    updatedAt: '2026-02-03T14:20:00Z',
  },
];

const MOCK_VENDOR_SUGGESTIONS = [
  { vendorName: 'GRAB *GRABFOOD', categoryId: 'cat-food' },
  { vendorName: 'MRT TOP-UP', categoryId: 'cat-transport' },
  { vendorName: 'SHOPEE SG', categoryId: 'cat-shopping' },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ===========================================================================
// ConfidenceIndicator
// ===========================================================================

describe('ConfidenceIndicator', () => {
  let ConfidenceIndicator: typeof import('@/components/shared/ConfidenceIndicator').ConfidenceIndicator;

  beforeEach(async () => {
    ({ ConfidenceIndicator } = await import('@/components/shared/ConfidenceIndicator'));
  });

  it('renders high confidence dot with correct aria-label', () => {
    render(<ConfidenceIndicator confidence={Confidence.HIGH} />);
    expect(screen.getByRole('img', { name: /high confidence/i })).toBeInTheDocument();
    expect(screen.getByTestId('confidence-dot')).toHaveClass('bg-green-500');
  });

  it('renders medium confidence dot', () => {
    render(<ConfidenceIndicator confidence={Confidence.MEDIUM} />);
    expect(screen.getByRole('img', { name: /medium confidence/i })).toBeInTheDocument();
    expect(screen.getByTestId('confidence-dot')).toHaveClass('bg-amber-500');
  });

  it('renders low confidence dot', () => {
    render(<ConfidenceIndicator confidence={Confidence.LOW} />);
    expect(screen.getByRole('img', { name: /low confidence/i })).toBeInTheDocument();
    expect(screen.getByTestId('confidence-dot')).toHaveClass('bg-red-500');
  });
});

// ===========================================================================
// CategoryBadge
// ===========================================================================

describe('CategoryBadge', () => {
  let CategoryBadge: typeof import('@/components/shared/CategoryBadge').CategoryBadge;

  beforeEach(async () => {
    ({ CategoryBadge } = await import('@/components/shared/CategoryBadge'));
  });

  it('renders category name and icon', () => {
    render(<CategoryBadge name="Food & Beverage" icon="🍔" color="#ef4444" />);
    expect(screen.getByTestId('category-badge')).toHaveTextContent('🍔');
    expect(screen.getByTestId('category-badge')).toHaveTextContent('Food & Beverage');
  });

  it('applies category color as inline style', () => {
    render(<CategoryBadge name="Food" icon="🍔" color="#ef4444" />);
    const badge = screen.getByTestId('category-badge');
    expect(badge).toHaveStyle({ color: '#ef4444' });
  });
});

// ===========================================================================
// CurrencyDisplay
// ===========================================================================

describe('CurrencyDisplay', () => {
  let CurrencyDisplay: typeof import('@/components/shared/CurrencyDisplay').CurrencyDisplay;

  beforeEach(async () => {
    ({ CurrencyDisplay } = await import('@/components/shared/CurrencyDisplay'));
  });

  it('formats amount as SGD currency', () => {
    render(<CurrencyDisplay amount={1023.49} />);
    const el = screen.getByTestId('currency-display');
    // SGD format: $1,023.49 (en-SG locale)
    expect(el.textContent).toMatch(/1,023\.49/);
  });

  it('formats zero amount', () => {
    render(<CurrencyDisplay amount={0} />);
    const el = screen.getByTestId('currency-display');
    expect(el.textContent).toMatch(/0\.00/);
  });

  it('applies monospace font class', () => {
    render(<CurrencyDisplay amount={10} />);
    expect(screen.getByTestId('currency-display')).toHaveClass('font-mono');
  });
});

// ===========================================================================
// EmptyState
// ===========================================================================

describe('EmptyState', () => {
  let EmptyState: typeof import('@/components/shared/EmptyState').EmptyState;

  beforeEach(async () => {
    ({ EmptyState } = await import('@/components/shared/EmptyState'));
  });

  it('renders title and description', () => {
    render(<EmptyState title="No data" description="Nothing to show here" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nothing to show here')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Empty"
        description="Add something"
        action={{ label: 'Add Item', onClick }}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Add Item' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders custom icon', () => {
    render(<EmptyState icon="🎉" title="Done" description="All good" />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });
});

// ===========================================================================
// TransactionTable
// ===========================================================================

describe('TransactionTable', () => {
  let TransactionTable: typeof import('@/components/transactions/TransactionTable').TransactionTable;

  beforeEach(async () => {
    ({ TransactionTable } = await import('@/components/transactions/TransactionTable'));
  });

  it('renders all transaction rows', () => {
    const onRowClick = vi.fn();
    const onPageChange = vi.fn();
    render(
      <TransactionTable
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        page={1}
        total={3}
        limit={20}
        hasMore={false}
        onPageChange={onPageChange}
        onRowClick={onRowClick}
      />,
    );

    expect(screen.getByTestId('transaction-row-tx-001')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-row-tx-002')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-row-tx-003')).toBeInTheDocument();
  });

  it('displays vendor names in rows', () => {
    render(
      <TransactionTable
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        page={1}
        total={3}
        limit={20}
        hasMore={false}
        onPageChange={vi.fn()}
        onRowClick={vi.fn()}
      />,
    );

    expect(screen.getByText('GRAB *GRABFOOD')).toBeInTheDocument();
    expect(screen.getByText('MRT TOP-UP')).toBeInTheDocument();
    expect(screen.getByText('SHOPEE SG')).toBeInTheDocument();
  });

  it('renders category badges for transactions', () => {
    render(
      <TransactionTable
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        page={1}
        total={3}
        limit={20}
        hasMore={false}
        onPageChange={vi.fn()}
        onRowClick={vi.fn()}
      />,
    );

    const badges = screen.getAllByTestId('category-badge');
    expect(badges.length).toBe(3);
  });

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(
      <TransactionTable
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        page={1}
        total={3}
        limit={20}
        hasMore={false}
        onPageChange={vi.fn()}
        onRowClick={onRowClick}
      />,
    );

    fireEvent.click(screen.getByTestId('transaction-row-tx-001'));
    expect(onRowClick).toHaveBeenCalledWith(MOCK_TRANSACTIONS[0]);
  });

  it('shows pagination info', () => {
    render(
      <TransactionTable
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        page={1}
        total={3}
        limit={20}
        hasMore={false}
        onPageChange={vi.fn()}
        onRowClick={vi.fn()}
      />,
    );

    expect(screen.getByText(/Showing 1–3 of 3/i)).toBeInTheDocument();
  });

  it('disables Prev button on first page', () => {
    render(
      <TransactionTable
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        page={1}
        total={3}
        limit={20}
        hasMore={false}
        onPageChange={vi.fn()}
        onRowClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
  });

  it('disables Next button when no more pages', () => {
    render(
      <TransactionTable
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        page={1}
        total={3}
        limit={20}
        hasMore={false}
        onPageChange={vi.fn()}
        onRowClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
  });

  it('calls onPageChange when Next is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <TransactionTable
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        page={1}
        total={40}
        limit={20}
        hasMore={true}
        onPageChange={onPageChange}
        onRowClick={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders confidence legend', () => {
    render(
      <TransactionTable
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        page={1}
        total={3}
        limit={20}
        hasMore={false}
        onPageChange={vi.fn()}
        onRowClick={vi.fn()}
      />,
    );

    expect(screen.getByText(/Confidence/)).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('calls onSort when column header is clicked', () => {
    const onSort = vi.fn();
    render(
      <TransactionTable
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        page={1}
        total={3}
        limit={20}
        hasMore={false}
        onPageChange={vi.fn()}
        onRowClick={vi.fn()}
        onSort={onSort}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /sort by date/i }));
    expect(onSort).toHaveBeenCalledWith('transactionDate');
  });
});

// ===========================================================================
// TransactionCardList
// ===========================================================================

describe('TransactionCardList', () => {
  let TransactionCardList: typeof import('@/components/transactions/TransactionCard').TransactionCardList;

  beforeEach(async () => {
    ({ TransactionCardList } = await import('@/components/transactions/TransactionCard'));
  });

  it('renders a card for each transaction', () => {
    render(
      <TransactionCardList
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        onCardClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId('transaction-card-tx-001')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-card-tx-002')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-card-tx-003')).toBeInTheDocument();
  });

  it('displays vendor name, category badge and amount', () => {
    render(
      <TransactionCardList
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        onCardClick={vi.fn()}
      />,
    );

    expect(screen.getByText('GRAB *GRABFOOD')).toBeInTheDocument();
    expect(screen.getAllByTestId('category-badge').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByTestId('currency-display').length).toBe(3);
  });

  it('calls onCardClick when a card is clicked', () => {
    const onCardClick = vi.fn();
    render(
      <TransactionCardList
        transactions={MOCK_TRANSACTIONS}
        categories={MOCK_CATEGORIES}
        onCardClick={onCardClick}
      />,
    );

    fireEvent.click(screen.getByTestId('transaction-card-tx-002'));
    expect(onCardClick).toHaveBeenCalledWith(MOCK_TRANSACTIONS[1]);
  });
});

// ===========================================================================
// TransactionFilters
// ===========================================================================

describe('TransactionFilters', () => {
  let TransactionFilters: typeof import('@/components/transactions/TransactionFilters').TransactionFilters;

  beforeEach(async () => {
    ({ TransactionFilters } = await import('@/components/transactions/TransactionFilters'));
  });

  it('renders filter controls', () => {
    render(
      <TransactionFilters
        categories={MOCK_CATEGORIES}
        onFilterChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('transaction-filters')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /source/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start date/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end date/i })).toBeInTheDocument();
  });

  it('does not show Clear button initially', () => {
    render(
      <TransactionFilters
        categories={MOCK_CATEGORIES}
        onFilterChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });
});

// ===========================================================================
// AddTransactionSheet
// ===========================================================================

describe('AddTransactionSheet', () => {
  let AddTransactionSheet: typeof import('@/components/transactions/AddTransactionSheet').AddTransactionSheet;

  beforeEach(async () => {
    ({ AddTransactionSheet } = await import('@/components/transactions/AddTransactionSheet'));
  });

  it('renders form fields when open', () => {
    render(
      <AddTransactionSheet
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        vendorSuggestions={MOCK_VENDOR_SUGGESTIONS}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Add Transaction' })).toBeInTheDocument();
    expect(screen.getByLabelText(/vendor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    // Radix Select may render multiple combobox elements (visible trigger + hidden native select)
    expect(screen.getAllByRole('combobox', { name: /category/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('does not render content when closed', () => {
    render(
      <AddTransactionSheet
        open={false}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        vendorSuggestions={MOCK_VENDOR_SUGGESTIONS}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByText('Add Transaction')).not.toBeInTheDocument();
  });

  it('shows vendor suggestions when typing', async () => {
    const user = userEvent.setup();
    render(
      <AddTransactionSheet
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        vendorSuggestions={MOCK_VENDOR_SUGGESTIONS}
        onSubmit={vi.fn()}
      />,
    );

    const vendorInput = screen.getByLabelText(/vendor/i);
    await user.click(vendorInput);
    await user.type(vendorInput, 'GRAB');

    await waitFor(() => {
      expect(screen.getByTestId('vendor-suggestions')).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <AddTransactionSheet
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        vendorSuggestions={MOCK_VENDOR_SUGGESTIONS}
        onSubmit={onSubmit}
      />,
    );

    // Fill in vendor
    await user.type(screen.getByLabelText(/vendor/i), 'STARBUCKS');

    // Fill in amount
    await user.type(screen.getByLabelText(/amount/i), '8.90');

    // Select category — use fireEvent for reliable Radix Select interaction in jsdom
    const triggers = screen.getAllByRole('combobox', { name: /category/i });
    await user.click(triggers[0]);
    const option = await screen.findByRole('option', { name: /Food & Beverage/i });
    await user.click(option);

    // Submit — wait for form to become valid
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add transaction/i })).not.toBeDisabled();
    });
    const submitBtn = screen.getByRole('button', { name: /add transaction/i });

    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.vendor).toBe('STARBUCKS');
      expect(callArgs.amount).toBe(8.9);
      expect(callArgs.categoryId).toBe('cat-food');
    });
  });
});

// ===========================================================================
// TransactionSheet (detail/edit)
// ===========================================================================

describe('TransactionSheet', () => {
  let TransactionSheet: typeof import('@/components/transactions/TransactionSheet').TransactionSheet;

  beforeEach(async () => {
    ({ TransactionSheet } = await import('@/components/transactions/TransactionSheet'));
  });

  it('renders transaction details when open', () => {
    render(
      <TransactionSheet
        transaction={MOCK_TRANSACTIONS[0]}
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Transaction Details')).toBeInTheDocument();
    expect(screen.getByDisplayValue('GRAB *GRABFOOD')).toBeInTheDocument();
    expect(screen.getByDisplayValue('18.5')).toBeInTheDocument();
  });

  it('shows source badge (Email for email-sourced tx)', () => {
    render(
      <TransactionSheet
        transaction={MOCK_TRANSACTIONS[0]}
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/email/i)).toBeInTheDocument();
  });

  it('shows raw email subject for email-sourced transactions', () => {
    render(
      <TransactionSheet
        transaction={MOCK_TRANSACTIONS[0]}
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Transaction alert: GRAB *GRABFOOD')).toBeInTheDocument();
  });

  it('renders disabled AI Feedback button (stubbed FEAT-013)', () => {
    render(
      <TransactionSheet
        transaction={MOCK_TRANSACTIONS[0]}
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onCategoryChange={vi.fn()}
      />,
    );

    const feedbackBtn = screen.getByTestId('feedback-btn');
    expect(feedbackBtn).toBeDisabled();
    expect(feedbackBtn).toHaveTextContent(/give ai feedback/i);
  });

  it('shows delete confirmation on delete click', async () => {
    const user = userEvent.setup();
    render(
      <TransactionSheet
        transaction={MOCK_TRANSACTIONS[0]}
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onCategoryChange={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId('delete-btn'));
    expect(screen.getByTestId('delete-confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onDelete when confirmed', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <TransactionSheet
        transaction={MOCK_TRANSACTIONS[0]}
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        onUpdate={vi.fn()}
        onDelete={onDelete}
        onCategoryChange={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId('delete-btn'));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('tx-001');
    });
  });

  it('Save button is disabled when no changes made', () => {
    render(
      <TransactionSheet
        transaction={MOCK_TRANSACTIONS[0]}
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('save-btn')).toBeDisabled();
  });

  it('enables Save button when fields are modified', async () => {
    const user = userEvent.setup();
    render(
      <TransactionSheet
        transaction={MOCK_TRANSACTIONS[0]}
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onCategoryChange={vi.fn()}
      />,
    );

    const vendorInput = screen.getByDisplayValue('GRAB *GRABFOOD');
    await user.clear(vendorInput);
    await user.type(vendorInput, 'GRAB FOOD UPDATED');

    await waitFor(() => {
      expect(screen.getByTestId('save-btn')).not.toBeDisabled();
    });
  });

  it('does not render when transaction is null', () => {
    render(
      <TransactionSheet
        transaction={null}
        open={true}
        onOpenChange={vi.fn()}
        categories={MOCK_CATEGORIES}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onCategoryChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('Transaction Details')).not.toBeInTheDocument();
  });
});
