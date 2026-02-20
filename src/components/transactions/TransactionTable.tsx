'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { useCallback } from 'react';

import type { Confidence } from '@/lib/enums';
import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';

import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  page: number;
  total: number;
  limit: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onRowClick: (transaction: Transaction) => void;
  onSort?: (field: string) => void;
}

const ROW_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.25, ease: 'easeOut' as const },
  }),
};

export function TransactionTable({
  transactions,
  categories,
  page,
  total,
  limit,
  hasMore,
  onPageChange,
  onRowClick,
  onSort,
}: TransactionTableProps) {
  const getCategoryForTx = useCallback(
    (categoryId: string) => categories.find((c) => c.id === categoryId),
    [categories],
  );

  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-25">
              <button
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={() => onSort?.('transactionDate')}
                aria-label="Sort by date"
              >
                Date
                <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={() => onSort?.('vendor')}
                aria-label="Sort by vendor"
              >
                Vendor
                <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">
              <button
                className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                onClick={() => onSort?.('amount')}
                aria-label="Sort by amount"
              >
                Amount
                <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
            </TableHead>
            <TableHead className="w-15 text-center">
              <span title="AI Confidence">⚡</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx, i) => {
            const category = getCategoryForTx(tx.categoryId);
            return (
              <motion.tr
                key={tx.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={ROW_VARIANTS}
                className="hover:bg-muted/50 border-b transition-colors cursor-pointer"
                onClick={() => onRowClick(tx)}
                role="row"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick(tx);
                  }
                }}
                data-testid={`transaction-row-${tx.id}`}
              >
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(tx.transactionDate), 'dd MMM')}
                </TableCell>
                <TableCell className="font-medium">{tx.vendor}</TableCell>
                <TableCell>
                  {category ? (
                    <CategoryBadge
                      name={category.name}
                      icon={category.icon}
                      color={category.color}
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={tx.amount} />
                </TableCell>
                <TableCell className="text-center">
                  <ConfidenceIndicator confidence={tx.confidence as Confidence} />
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {startItem}–{endItem} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              ← Prev
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  aria-label={`Page ${pageNum}`}
                  aria-current={pageNum === page ? 'page' : undefined}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={!hasMore}
              aria-label="Next page"
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Confidence legend */}
      <div className="flex items-center gap-4 px-2 text-xs text-muted-foreground">
        <span>⚡ Confidence:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Low
        </span>
      </div>
    </div>
  );
}
