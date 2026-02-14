export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  vendor: string;
  description: string;
  transactionDate: string;
  resendEmailId: string | null;
  rawEmailSubject: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'email' | 'manual';
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreate {
  userId: string;
  categoryId: string;
  amount: number;
  vendor: string;
  description: string;
  transactionDate: string;
  resendEmailId: string | null;
  rawEmailSubject: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'email' | 'manual';
}

export interface TransactionUpdate {
  categoryId?: string;
  amount?: number;
  vendor?: string;
  description?: string;
  transactionDate?: string;
  confidence?: 'high' | 'medium' | 'low';
}
