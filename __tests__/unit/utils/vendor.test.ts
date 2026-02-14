import { describe, it, expect } from 'vitest';
import { normalizeVendorName } from '@/lib/utils/vendor';

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
  });
});
