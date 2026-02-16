/**
 * Tool: Extract expense data from email content.
 *
 * Provides a regex fast-path for common Singapore bank alert formats
 * (UOB, DBS, OCBC), and an LLM-backed tool for ambiguous emails.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Result of regex-based expense extraction.
 */
export interface ExtractedExpense {
  amount: number;
  vendor: string;
  dateRaw: string | null;
}

/**
 * Regex fast-path extraction from plain text.
 * Handles SGD/S$ amount formats and common bank alert patterns.
 *
 * Returns null if this doesn't look like a transaction email.
 */
export function extractExpenseFromText(text: string): ExtractedExpense | null {
  if (!text) {return null;}

  // Patterns: "SGD 16.23", "SGD 1,234.56", "S$48.00", "S$ 89.99"
  const amountMatch = text.match(
    /(?:SGD|S\$)\s*([\d,]+\.\d{2})/i
  );

  if (!amountMatch) {return null;}

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) {return null;}

  // --- Vendor extraction ---
  // Pattern 1: "at VENDOR_NAME" (UOB/DBS/OCBC alerts)
  // Pattern 2: "to VENDOR_NAME" (OCBC payment)
  let vendor: string | null = null;

  const vendorAtMatch = text.match(
    /\bat\s+([A-Z][A-Z0-9 .*\-]+?)(?:(?:\.\s)|(?:,\s)|\s+(?:for|on|If)\b|$)/i
  );
  if (vendorAtMatch) {
    vendor = vendorAtMatch[1].trim().toUpperCase().replace(/[.]+$/, '');
  }

  if (!vendor) {
    const vendorToMatch = text.match(
      /\bto\s+([A-Z][A-Z0-9 .*\-]+?)(?:(?:\.\s)|(?:,\s)|\s+(?:for|on|If)\b|$)/i
    );
    if (vendorToMatch) {
      vendor = vendorToMatch[1].trim().toUpperCase().replace(/[.]+$/, '');
    }
  }

  // Pattern 1: DD/MM/YY (Singapore format)
  // Pattern 2: DD Mon YYYY
  let dateRaw: string | null = null;

  const dateSlashMatch = text.match(/\b(\d{2}\/\d{2}\/\d{2})\b/);
  if (dateSlashMatch) {
    dateRaw = dateSlashMatch[1];
  } else {
    const dateLongMatch = text.match(
      /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\b/i
    );
    if (dateLongMatch) {
      dateRaw = dateLongMatch[1];
    }
  }

  return { amount, vendor: vendor || 'UNKNOWN', dateRaw };
}

/**
 * LangChain tool definition for the LLM to call.
 * The LLM uses this when the regex fast path fails or for complex emails.
 */
export const extractExpenseTool = tool(
  ({ emailText, emailHtml, emailSubject, emailDate }) => {
    // Try regex fast path first
    const regexResult = extractExpenseFromText(emailText || emailHtml || '');

    if (regexResult) {
      return JSON.stringify({
        vendor: regexResult.vendor,
        amount: regexResult.amount,
        transactionDate: regexResult.dateRaw || emailDate,
        method: 'regex',
        emailSubject,
      });
    }

    // If regex couldn't extract, return raw data for LLM to reason about
    return JSON.stringify({
      vendor: null,
      amount: null,
      transactionDate: emailDate,
      method: 'needs_llm',
      rawContent: (emailText || emailHtml || '').slice(0, 2000),
      emailSubject,
    });
  },
  {
    name: 'extract_expense',
    description: `Extract the vendor name, transaction amount (in SGD), and transaction date from a bank/merchant email. 

    RULES:
    - Amount: Extract the numeric value. Currency is always SGD.
    - Vendor: Extract the merchant/vendor name as it appears. Clean up common prefixes like "GRAB *", "SQ *", etc.
    - Date: Convert to ISO 8601 format in Singapore timezone (UTC+8). If the email only has a date like "08/02/26", interpret as DD/MM/YY (Singapore format).
    - If the email received date is provided as ISO 8601 (e.g., "2026-02-08T01:31:00+00:00"), convert to SGT by adding 8 hours.`,
    schema: z.object({
      emailText: z.string().describe('Plain text content of the email'),
      emailHtml: z.string().describe('HTML content of the email'),
      emailSubject: z.string().describe('Subject line of the email'),
      emailDate: z.string().describe('ISO 8601 date when email was received'),
    }),
  }
);
