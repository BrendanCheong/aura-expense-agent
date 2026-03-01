'use client';

import Link from 'next/link';

import type { RecentTransaction } from '@/types/dashboard';

interface RecentTransactionsListProps {
  transactions: RecentTransaction[];
  selectedCategory?: string | null;
}

function formatSGD(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
  });
}

export function RecentTransactionsList({
  transactions,
  selectedCategory,
}: RecentTransactionsListProps) {
  const filtered =
    selectedCategory
      ? transactions.filter((tx) => tx.categoryName === selectedCategory)
      : transactions;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground text-sm">No recent transactions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="divide-y">
        {filtered.map((tx) => (
          <div
            key={tx.id}
            data-testid="recent-tx-row"
            className="flex items-center justify-between py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{tx.categoryIcon}</span>
              <div>
                <p className="text-sm font-medium">{tx.vendor}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDate(tx.transactionDate)}
                </p>
              </div>
            </div>
            <span className="font-mono text-sm font-medium tabular-nums">
              {formatSGD(tx.amount)}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-2 text-center">
        <Link
          href="/transactions"
          className="text-primary text-sm font-medium hover:underline"
        >
          View All Transactions
        </Link>
      </div>
    </div>
  );
}
