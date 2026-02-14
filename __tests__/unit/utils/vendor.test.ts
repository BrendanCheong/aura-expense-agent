import { describe, it, expect } from 'vitest';
import { normalizeVendorName, extractRoughVendor } from '@/lib/utils/vendor';

describe('Vendor Utilities', () => {
  describe('normalizeVendorName', () => {
    it('trims whitespace', () => {
      const result = normalizeVendorName('  GRAB *GRABFOOD  ');
      expect(result).toBe('GRAB *GRABFOOD');
    });

    it('converts to uppercase', () => {
      const result = normalizeVendorName('digitalocean.com');
      expect(result).toBe('DIGITALOCEAN.COM');
    });

    it('collapses multiple spaces', () => {
      const result = normalizeVendorName('YA  KUN   KAYA TOAST');
      expect(result).toBe('YA KUN KAYA TOAST');
    });

    it('preserves vendor names with special characters', () => {
      expect(normalizeVendorName('GRAB *GRABFOOD')).toBe('GRAB *GRABFOOD');
      expect(normalizeVendorName('NETFLIX.COM')).toBe('NETFLIX.COM');
    });

    it('handles already normalized name', () => {
      expect(normalizeVendorName('GRAB')).toBe('GRAB');
    });

    it('handles empty string', () => {
      expect(normalizeVendorName('')).toBe('');
    });

    it('removes trailing dots', () => {
      expect(normalizeVendorName('DIGITALOCEAN.COM.')).toBe('DIGITALOCEAN.COM');
    });

    it('removes multiple trailing dots', () => {
      expect(normalizeVendorName('VENDOR...')).toBe('VENDOR');
    });
  });

  describe('extractRoughVendor', () => {
    it('extracts vendor from UOB bank alert format', () => {
      const text = 'A transaction of SGD 16.23 was made at DIGITALOCEAN.COM. If this was not done by you';
      expect(extractRoughVendor(text)).toBe('DIGITALOCEAN.COM');
    });

    it('extracts vendor from DBS alert format', () => {
      const text = 'You have made a purchase of SGD 89.99 at AMAZON.SG on 08 Feb 2026';
      expect(extractRoughVendor(text)).toBe('AMAZON.SG');
    });

    it('extracts vendor from "at VENDOR" pattern', () => {
      const text = 'Transaction alert at GRAB *GRABFOOD for SGD 18.50';
      expect(extractRoughVendor(text)).toBe('GRAB *GRABFOOD');
    });

    it('returns null for non-transaction email', () => {
      expect(extractRoughVendor('Welcome to our newsletter! Click here to subscribe.')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(extractRoughVendor('')).toBeNull();
    });
  });
});
