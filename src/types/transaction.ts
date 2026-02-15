import { Confidence, TransactionSource } from '@/lib/enums';

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
  confidence: Confidence;
  source: TransactionSource;
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
  confidence: Confidence;
  source: TransactionSource;
}

export interface TransactionUpdate {
  categoryId?: string;
  amount?: number;
  vendor?: string;
  description?: string;
  transactionDate?: string;
  confidence?: Confidence;
}
