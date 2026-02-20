export interface DashboardSummary {
  totalSpent: number;
  totalBudget: number;
  percentUsed: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    spent: number;
    budgeted: number;
  }>;
}
