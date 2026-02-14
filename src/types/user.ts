export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  inboundEmail: string;
  oauthProvider: 'google' | 'github';
  monthlySalary: number | null;
  budgetMode: 'direct' | 'percentage';
  createdAt: string;
  updatedAt: string;
}

export interface UserCreate {
  email: string;
  name: string;
  avatarUrl: string;
  oauthProvider: 'google' | 'github';
}

export interface UserUpdate {
  name?: string;
  avatarUrl?: string;
  monthlySalary?: number | null;
  budgetMode?: 'direct' | 'percentage';
}
