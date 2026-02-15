/**
 * Transaction service — business logic for expense transactions.
 *
 * Will be fully implemented during feature development.
 */

import type {
  ITransactionRepository,
  IVendorCacheRepository,
  TransactionQueryOptions,
  PaginatedResult,
} from '@/lib/repositories/interfaces';
import type { Transaction, TransactionUpdate } from '@/types/transaction';
import { normalizeVendorName } from '@/lib/utils/vendor';
import { Confidence, TransactionSource } from '@/lib/enums';

export class TransactionService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly vendorCacheRepo: IVendorCacheRepository,
  ) {}

  async listTransactions(userId: string, options: TransactionQueryOptions): Promise<PaginatedResult<Transaction>> {
    return this.transactionRepo.findByUserId(userId, options);
  }

  async getTransaction(userId: string, transactionId: string): Promise<Transaction> {
    const tx = await this.transactionRepo.findById(transactionId);
    if (!tx || tx.userId !== userId) {
      throw new NotFoundError(`Transaction ${transactionId} not found`);
    }
    return tx;
  }

  async createManualTransaction(userId: string, data: {
    amount: number;
    vendor: string;
    categoryId: string;
    transactionDate: string;
    description?: string;
  }): Promise<Transaction> {
    if (data.amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    const transaction = await this.transactionRepo.create({
      userId: userId,
      categoryId: data.categoryId,
      amount: data.amount,
      vendor: data.vendor,
      description: data.description || '',
      transactionDate: data.transactionDate,
      resendEmailId: null,
      rawEmailSubject: '',
      confidence: Confidence.HIGH,
      source: TransactionSource.MANUAL,
    });

    const normalizedVendor = normalizeVendorName(data.vendor);
    const cached = await this.vendorCacheRepo.findByUserAndVendor(userId, normalizedVendor);
    if (!cached) {
      await this.vendorCacheRepo.create(userId, normalizedVendor, data.categoryId);
    }

    return transaction;
  }

  async updateTransaction(userId: string, transactionId: string, data: TransactionUpdate): Promise<Transaction> {
    const existing = await this.getTransaction(userId, transactionId);

    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const normalizedVendor = normalizeVendorName(existing.vendor);
      const cached = await this.vendorCacheRepo.findByUserAndVendor(userId, normalizedVendor);
      if (cached) {
        await this.vendorCacheRepo.updateCategoryId(cached.id, data.categoryId);
      }
    }

    return this.transactionRepo.update(transactionId, data);
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    await this.getTransaction(userId, transactionId);
    await this.transactionRepo.delete(transactionId);
  }

  async isDuplicate(resendEmailId: string): Promise<boolean> {
    const existing = await this.transactionRepo.findByResendEmailId(resendEmailId);
    return existing !== null;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'NotFoundError'; }
}

export class ValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'ValidationError'; }
}
