import { OAuthProvider, BudgetMode } from '@/lib/enums';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  inboundEmail: string;
  oauthProvider: OAuthProvider;
  monthlySalary: number | null;
  budgetMode: BudgetMode;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreate {
  email: string;
  name: string;
  avatarUrl: string;
  oauthProvider: OAuthProvider;
}

export interface UserUpdate {
  name?: string;
  avatarUrl?: string;
  monthlySalary?: number | null;
  budgetMode?: BudgetMode;
}
