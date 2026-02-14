export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  year: number;
  month: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCreate {
  userId: string;
  categoryId: string;
  amount: number;
  year: number;
  month: number;
}

export interface BudgetUpdate {
  amount?: number;
}
