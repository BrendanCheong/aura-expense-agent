export interface WebhookProcessResult {
  status: 'duplicate' | 'cached' | 'processed' | 'skipped';
  transactionId?: string;
}
