import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency } from '@/lib/utils/currency';

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('formats a standard amount', () => {
      const result = formatCurrency(1023.5);
      expect(result).toContain('1,023.50');
    });

    it('formats zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0.00');
    });

    it('formats a negative amount', () => {
      const result = formatCurrency(-27.19);
      expect(result).toContain('27.19');
    });

    it('formats a small amount with two decimal places', () => {
      const result = formatCurrency(5.8);
      expect(result).toContain('5.80');
    });
  });

  describe('parseCurrency', () => {
    it('parses a dollar amount string', () => {
      expect(parseCurrency('$16.23')).toBe(16.23);
    });

    it('parses a comma-separated amount', () => {
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
    });

    it('parses a plain numeric string', () => {
      expect(parseCurrency('89.99')).toBe(89.99);
    });

    it('returns 0 for non-numeric string', () => {
      expect(parseCurrency('Welcome to our service')).toBe(0);
    });

    it('parses amount with SGD prefix', () => {
      expect(parseCurrency('SGD 16.23')).toBe(16.23);
    });
  });
});
