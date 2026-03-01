'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { BudgetProgressList } from '@/components/dashboard/BudgetProgressList';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import { SpendingDonut } from '@/components/dashboard/SpendingDonut';
import { TimeRangeTabs } from '@/components/dashboard/TimeRangeTabs';
import { useDashboard } from '@/hooks/use-dashboard';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-64" />
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const {
    summary,
    alerts,
    isLoading,
    error,
    period,
    setPeriod,
    selectedCategory,
    setSelectedCategory,
    filteredTransactions,
  } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive text-lg font-medium">
          Failed to load dashboard
        </p>
        <p className="text-muted-foreground mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Your spending overview at a glance
          </p>
        </div>
        <TimeRangeTabs value={period} onChange={setPeriod} />
      </div>

      {/* Alerts */}
      {alerts && alerts.alerts.length > 0 && (
        <AlertBanner alerts={alerts.alerts} />
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold tabular-nums">
                {new Intl.NumberFormat('en-SG', {
                  style: 'currency',
                  currency: 'SGD',
                }).format(summary.summary.totalSpent)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Total Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold tabular-nums">
                {new Intl.NumberFormat('en-SG', {
                  style: 'currency',
                  currency: 'SGD',
                }).format(summary.summary.totalBudget)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold tabular-nums">
                {summary.summary.transactionCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold tabular-nums">
                {new Intl.NumberFormat('en-SG', {
                  style: 'currency',
                  currency: 'SGD',
                }).format(summary.summary.averageTransaction)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts row */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <SpendingDonut
                data={summary.byCategory}
                totalSpent={summary.summary.totalSpent}
                selectedCategory={selectedCategory}
                onSegmentClick={(id) => {
                  setSelectedCategory(
                    selectedCategory === id ? null : id,
                  );
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Budget Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetProgressList budgets={summary.byCategory} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Transactions */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactionsList
              transactions={filteredTransactions}
              selectedCategory={selectedCategory}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
