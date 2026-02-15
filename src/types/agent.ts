import { Confidence } from '@/lib/enums';

export interface AgentInput {
  emailHtml: string;
  emailText: string;
  emailSubject: string;
  emailDate: string;
  resendEmailId: string;
  userId: string;
}

export interface AgentOutput {
  transactionId: string;
  vendor: string;
  amount: number;
  categoryId: string;
  confidence: Confidence;
}

export interface ExpenseAgentConfig {
  tools: unknown[];
  model: string;
  apiKey: string;
  temperature: number;
}
