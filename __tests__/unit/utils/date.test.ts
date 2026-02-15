import { describe, it, expect } from 'vitest';

import { getMonthDateRange, formatDate, getCurrentPeriod } from '@/lib/utils/date';

describe('Date Utilities', () => {
  describe('getMonthDateRange', () => {
    it('returns correct range for February 2026', () => {
      const { start, end } = getMonthDateRange(2026, 2);
      expect(start).toContain('2026-02-01');
      expect(end).toContain('2026-03-01');
    });

    it('returns correct range for December (year boundary)', () => {
      const { start, end } = getMonthDateRange(2025, 12);
      expect(start).toContain('2025-12-01');
      expect(end).toContain('2026-01-01');
    });

    it('handles leap year February', () => {
      const { start, end } = getMonthDateRange(2028, 2);
      expect(start).toContain('2028-02-01');
      expect(end).toContain('2028-03-01');
    });

    it('returns ISO strings', () => {
      const { start, end } = getMonthDateRange(2026, 1);
      expect(() => new Date(start)).not.toThrow();
      expect(() => new Date(end)).not.toThrow();
    });
  });

  describe('formatDate', () => {
    it('formats an ISO date string to human readable', () => {
      const result = formatDate('2026-02-08T09:31:00+08:00');
      expect(result).toContain('Feb');
      expect(result).toContain('2026');
      expect(result).toContain('8');
    });

    it('handles a plain date string', () => {
      const result = formatDate('2026-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('2026');
    });
  });

  describe('getCurrentPeriod', () => {
    it('returns year and month as numbers', () => {
      const { year, month } = getCurrentPeriod();
      expect(typeof year).toBe('number');
      expect(typeof month).toBe('number');
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(year).toBeGreaterThanOrEqual(2024);
    });
  });
});
