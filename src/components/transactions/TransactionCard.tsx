'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';

import type { Confidence } from '@/lib/enums';
import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';

import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Card, CardContent } from '@/components/ui/card';

interface TransactionCardProps {
  transactions: Transaction[];
  categories: Category[];
  onCardClick: (transaction: Transaction) => void;
}

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' as const },
  }),
};

export function TransactionCardList({
  transactions,
  categories,
  onCardClick,
}: TransactionCardProps) {
  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);

  return (
    <div className="space-y-3" data-testid="transaction-card-list">
      {transactions.map((tx, i) => {
        const category = getCategory(tx.categoryId);
        return (
          <motion.div
            key={tx.id}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={CARD_VARIANTS}
          >
            <Card
              className="cursor-pointer transition-colors hover:bg-muted/30"
              onClick={() => onCardClick(tx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onCardClick(tx);
                }
              }}
              data-testid={`transaction-card-${tx.id}`}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{tx.vendor}</span>
                    <ConfidenceIndicator confidence={tx.confidence as Confidence} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(tx.transactionDate), 'dd MMM yyyy')}
                    </span>
                    {category && (
                      <CategoryBadge
                        name={category.name}
                        icon={category.icon}
                        color={category.color}
                        className="text-[10px]"
                      />
                    )}
                  </div>
                </div>
                <CurrencyDisplay amount={tx.amount} className="text-base font-semibold" />
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
