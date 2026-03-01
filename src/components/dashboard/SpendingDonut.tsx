'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { CategoryBreakdown } from '@/types/dashboard';

interface SpendingDonutProps {
  data: CategoryBreakdown[];
  totalSpent: number;
  selectedCategory?: string | null;
  onSegmentClick?: (categoryId: string) => void;
}

export function SpendingDonut({
  data,
  totalSpent,
  selectedCategory,
  onSegmentClick,
}: SpendingDonutProps) {
  if (data.length === 0) {
    return (
      <div data-testid="spending-donut" className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">No spending data yet</p>
      </div>
    );
  }

  return (
    <div data-testid="spending-donut" className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="spent"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            onClick={(_: unknown, index: number) => {
              if (onSegmentClick) {
                onSegmentClick(data[index].categoryId);
              }
            }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.categoryId}
                fill={entry.color}
                opacity={
                  selectedCategory && selectedCategory !== entry.categoryId
                    ? 0.4
                    : 1
                }
                className="cursor-pointer transition-opacity"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) =>
              new Intl.NumberFormat('en-SG', {
                style: 'currency',
                currency: 'SGD',
              }).format(value ?? 0)
            }
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-xs">Total Spent</p>
          <p
            data-testid="donut-total"
            className="font-mono text-xl font-bold tabular-nums"
          >
            {new Intl.NumberFormat('en-SG', {
              style: 'currency',
              currency: 'SGD',
            }).format(totalSpent)}
          </p>
        </div>
      </div>
    </div>
  );
}
