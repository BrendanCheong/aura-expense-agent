'use client';

import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import type { Transaction, TransactionUpdate } from '@/types/transaction';

import { EmptyState } from '@/components/shared/EmptyState';
import { AddTransactionSheet } from '@/components/transactions/AddTransactionSheet';
import { TransactionCardList } from '@/components/transactions/TransactionCard';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { TransactionSheet } from '@/components/transactions/TransactionSheet';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCategories } from '@/hooks/use-categories';
import { useTransactions } from '@/hooks/use-transactions';
import { useVendorCache } from '@/hooks/use-vendor-cache';

export default function TransactionsPage() {
  const {
    transactions,
    total,
    page,
    limit,
    hasMore,
    isLoading,
    error,
    setFilters,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch,
  } = useTransactions();

  const { categories, isLoading: categoriesLoading } = useCategories();
  const { vendors } = useVendorCache();

  const [addOpen, setAddOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleRowClick = useCallback((tx: Transaction) => {
    setSelectedTx(tx);
    setDetailOpen(true);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setFilters({ page: newPage });
    },
    [setFilters],
  );

  const handleSort = useCallback(
    (field: string) => {
      setFilters({ sortBy: field });
    },
    [setFilters],
  );

  const handleAddTransaction = useCallback(
    async (data: {
      amount: number;
      vendor: string;
      categoryId: string;
      transactionDate: string;
      description?: string;
    }) => {
      await createTransaction(data);
      toast.success(`Transaction added: ${data.vendor}`);
    },
    [createTransaction],
  );

  const handleUpdate = useCallback(
    async (id: string, data: TransactionUpdate) => {
      await updateTransaction(id, data);
      toast.success('Transaction updated');
    },
    [updateTransaction],
  );

  const handleCategoryChange = useCallback(
    async (id: string, categoryId: string) => {
      await updateTransaction(id, { categoryId });
      toast.success('Category updated — vendor cache refreshed');
    },
    [updateTransaction],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const tx = transactions.find((t) => t.id === id);
      await deleteTransaction(id);
      toast('Transaction deleted', {
        description: tx ? `${tx.vendor} — $${tx.amount.toFixed(2)}` : undefined,
        action: {
          label: 'Undo',
          onClick: () => {
            // Re-create the transaction (best-effort undo)
            if (tx) {
              void createTransaction({
                vendor: tx.vendor,
                amount: tx.amount,
                categoryId: tx.categoryId,
                transactionDate: tx.transactionDate,
                description: tx.description || undefined,
              });
            }
          },
        },
        duration: 8000,
      });
    },
    [transactions, deleteTransaction, createTransaction],
  );

  if (isLoading || categoriesLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View, add, and manage your expense transactions.
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Transaction</span>
        </Button>
      </div>

      <Separator />

      {/* Filters */}
      <TransactionFilters
        categories={categories}
        onFilterChange={(filters) => setFilters(filters)}
      />

      {/* Content */}
      {transactions.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No transactions found"
          description={
            total === 0
              ? 'Add your first transaction or forward a bank email to get started.'
              : 'No transactions match your current filters. Try adjusting them.'
          }
          action={
            total === 0
              ? { label: 'Add Transaction', onClick: () => setAddOpen(true) }
              : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table (hidden on mobile) */}
          <div className="hidden md:block">
            <TransactionTable
              transactions={transactions}
              categories={categories}
              page={page}
              total={total}
              limit={limit}
              hasMore={hasMore}
              onPageChange={handlePageChange}
              onRowClick={handleRowClick}
              onSort={handleSort}
            />
          </div>

          {/* Mobile card list (hidden on desktop) */}
          <div className="block md:hidden">
            <TransactionCardList
              transactions={transactions}
              categories={categories}
              onCardClick={handleRowClick}
            />
            {/* Mobile pagination */}
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                ← Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={!hasMore}
              >
                Next →
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Add Transaction Sheet */}
      <AddTransactionSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
        vendorSuggestions={vendors}
        onSubmit={handleAddTransaction}
      />

      {/* Transaction Detail Sheet */}
      <TransactionSheet
        transaction={selectedTx}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        categories={categories}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
}
