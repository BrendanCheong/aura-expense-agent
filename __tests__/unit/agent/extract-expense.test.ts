/**
 * Unit tests for the extract-expense tool.
 * Tests regex-based extraction from Singapore bank email alerts (UOB, DBS, OCBC).
 */

import { describe, test, expect } from 'vitest';

import emailSamples from '../../fixtures/email-samples.json';

import { extractExpenseFromText } from '@/lib/agent/tools/extract-expense';

describe('extractExpenseFromText', () => {
  test('UOB bank alert — extracts amount, vendor, and date', () => {
    const result = extractExpenseFromText(emailSamples.uob_bank_alert.text);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(16.23);
    expect(result!.vendor).toBe('DIGITALOCEAN.COM');
    expect(result!.dateRaw).toBe('08/02/26');
  });

  test('DBS bank alert — extracts amount and vendor', () => {
    const result = extractExpenseFromText(emailSamples.dbs_bank_alert.text);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(25.50);
    expect(result!.vendor).toBe('GRAB *GRABFOOD');
  });

  test('OCBC bank alert — handles S$ format', () => {
    const result = extractExpenseFromText(emailSamples.ocbc_bank_alert.text);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(89.99);
    expect(result!.vendor).toBe('AMAZON.SG');
  });

  test('large amount with comma — parses correctly', () => {
    const result = extractExpenseFromText(emailSamples.large_amount_comma.text);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(1234.56);
    expect(result!.vendor).toBe('SCOOT AIRLINES');
  });

  test('S$ format — parses correctly', () => {
    const result = extractExpenseFromText(emailSamples.s_dollar_format.text);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(48.00);
    expect(result!.vendor).toBe('SINGTEL MOBILE');
  });

  test('non-transaction email — returns null', () => {
    const result = extractExpenseFromText(emailSamples.newsletter_non_transaction.text);
    expect(result).toBeNull();
  });

  test('GrabFood receipt — extracts total amount', () => {
    const result = extractExpenseFromText(emailSamples.grab_receipt_html.text);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(18.50);
  });
});
