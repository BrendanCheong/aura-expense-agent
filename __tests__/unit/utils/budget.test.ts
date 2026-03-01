/**
 * Unit tests — Budget utility functions.
 *
 * Tests calculateBudgetStatus(), calculateOverAmount(), and formatBudgetAlertMessage().
 */

import { describe, it, expect } from 'vitest';

import {
  calculateBudgetStatus,
  calculateOverAmount,
  formatBudgetAlertMessage,
  BUDGET_WARNING_THRESHOLD,
  BUDGET_OVER_THRESHOLD,
} from '@/lib/utils/budget';

describe('Budget Utilities', () => {
  // =========================================================================
  // calculateBudgetStatus
  // =========================================================================
  describe('calculateBudgetStatus', () => {
    it('should return on_track when under 80%', () => {
      // ---- Prepare ----
      const spent = 200;
      const budget = 400;

      // ---- Act ----
      const result = calculateBudgetStatus(spent, budget);

      // ---- Assert ----
      expect(result.percentUsed).toBe(50);
      expect(result.status).toBe('on_track');
    });

    it('should return warning when at 80% threshold', () => {
      // ---- Prepare ----
      const spent = 80;
      const budget = 100;

      // ---- Act ----
      const result = calculateBudgetStatus(spent, budget);

      // ---- Assert ----
      expect(result.percentUsed).toBe(80);
      expect(result.status).toBe('warning');
    });

    it('should return warning when between 80% and 99%', () => {
      // ---- Prepare ----
      const spent = 85;
      const budget = 100;

      // ---- Act ----
      const result = calculateBudgetStatus(spent, budget);

      // ---- Assert ----
      expect(result.percentUsed).toBe(85);
      expect(result.status).toBe('warning');
    });

    it('should return over_budget when at 100%', () => {
      // ---- Prepare ----
      const spent = 300;
      const budget = 300;

      // ---- Act ----
      const result = calculateBudgetStatus(spent, budget);

      // ---- Assert ----
      expect(result.percentUsed).toBe(100);
      expect(result.status).toBe('over_budget');
    });

    it('should return over_budget when exceeding 100%', () => {
      // ---- Prepare ----
      const spent = 327.19;
      const budget = 300;

      // ---- Act ----
      const result = calculateBudgetStatus(spent, budget);

      // ---- Assert ----
      expect(result.percentUsed).toBeCloseTo(109.06, 1);
      expect(result.status).toBe('over_budget');
    });

    it('should return over_budget when budget is zero and spent > 0', () => {
      // ---- Prepare ----
      const spent = 50;
      const budget = 0;

      // ---- Act ----
      const result = calculateBudgetStatus(spent, budget);

      // ---- Assert ----
      expect(result.percentUsed).toBe(Infinity);
      expect(result.status).toBe('over_budget');
    });

    it('should return on_track when both budget and spent are zero', () => {
      // ---- Prepare ----
      const spent = 0;
      const budget = 0;

      // ---- Act ----
      const result = calculateBudgetStatus(spent, budget);

      // ---- Assert ----
      expect(result.percentUsed).toBe(0);
      expect(result.status).toBe('on_track');
    });
  });

  // =========================================================================
  // calculateOverAmount
  // =========================================================================
  describe('calculateOverAmount', () => {
    it('should return 0 when under budget', () => {
      expect(calculateOverAmount(200, 400)).toBe(0);
    });

    it('should return 0 when exactly at budget', () => {
      expect(calculateOverAmount(300, 300)).toBe(0);
    });

    it('should return the over amount when over budget', () => {
      expect(calculateOverAmount(327.19, 300)).toBeCloseTo(27.19, 2);
    });
  });

  // =========================================================================
  // formatBudgetAlertMessage
  // =========================================================================
  describe('formatBudgetAlertMessage', () => {
    it('should format over_budget message with dollar over amount', () => {
      // ---- Act ----
      const message = formatBudgetAlertMessage('Shopping', 327.19, 300, 'over_budget');

      // ---- Assert ----
      expect(message).toContain('Shopping');
      expect(message).toContain('$27.19');
      expect(message).toContain('over');
      expect(message).toContain('$300.00');
    });

    it('should format warning message with percentage', () => {
      // ---- Act ----
      const message = formatBudgetAlertMessage('Entertainment', 83.47, 100, 'warning');

      // ---- Assert ----
      expect(message).toContain('Entertainment');
      expect(message).toContain('83%');
      expect(message).toContain('$100.00');
    });
  });

  // =========================================================================
  // Threshold constants
  // =========================================================================
  describe('thresholds', () => {
    it('should export correct threshold values', () => {
      expect(BUDGET_WARNING_THRESHOLD).toBe(80);
      expect(BUDGET_OVER_THRESHOLD).toBe(100);
    });
  });
});
